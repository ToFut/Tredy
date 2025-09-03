#!/usr/bin/env node

/**
 * Simple Google Calendar MCP Server that works with access tokens only
 * Designed to work with Nango OAuth tokens
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class SimpleCalendarMCP {
  constructor() {
    // We use Nango instead of direct access tokens
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'simple-google-calendar', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupTools();
  }

  setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_calendar_events',
          description: 'Get calendar events, check calendar, view meetings for a specific date range',
          inputSchema: {
            type: 'object',
            properties: {
              timeMin: {
                type: 'string',
                description: 'Start time in ISO format (default: today)',
              },
              timeMax: {
                type: 'string', 
                description: 'End time in ISO format (optional)',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 10)',
                default: 10
              }
            }
          }
        },
        {
          name: 'book_meeting',
          description: 'Book a meeting, create calendar event, schedule appointment in Google Calendar. Use this when user asks to book, create, or schedule any meeting or event.',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Event title/summary'
              },
              startTime: {
                type: 'string',
                description: 'Start time in ISO format'
              },
              endTime: {
                type: 'string',
                description: 'End time in ISO format'
              },
              description: {
                type: 'string',
                description: 'Event description (optional)'
              },
              location: {
                type: 'string',
                description: 'Event location (optional)'
              }
            },
            required: ['summary', 'startTime', 'endTime']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_calendar_events':
            return await this.getCalendarEvents(args);
          case 'book_meeting':
            return await this.createCalendarEvent(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async getCalendarEvents(args = {}) {
    // Get data from Nango instead of direct API calls
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const {
      timeMin = new Date().toISOString().split('T')[0] + 'T00:00:00Z',
      timeMax,
      maxResults = 10
    } = args;

    const params = new URLSearchParams({
      timeMin,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: maxResults.toString()
    });

    if (timeMax) {
      params.append('timeMax', timeMax);
    }

    const endpoint = `/calendar/v3/calendars/primary/events?${params}`;
    
    // Use Nango's proxy to make the API call
    const response = await nango.get({
      endpoint,
      connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_3',
      providerConfigKey: 'google-calendar-getting-started'
    });

    const data = response.data;
    const events = data?.items || [];

    if (events.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No calendar events found for the specified time range.'
        }]
      };
    }

    const formattedEvents = events.map(event => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      return {
        title: event.summary || 'Untitled Event',
        start: start,
        end: end,
        description: event.description || '',
        location: event.location || '',
        id: event.id
      };
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(formattedEvents, null, 2)
      }]
    };
  }

  async createCalendarEvent(args) {
    // Use Nango for creating events too
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const { summary, startTime, endTime, description, location } = args;

    const eventData = {
      summary,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      ...(description && { description }),
      ...(location && { location })
    };

    // Use Nango's proxy to create the event
    const response = await nango.post({
      endpoint: '/calendar/v3/calendars/primary/events',
      connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_3',
      providerConfigKey: 'google-calendar-getting-started',
      data: eventData
    });

    const event = response.data;
    
    return {
      content: [{
        type: 'text',
        text: `✓ Calendar event created successfully: "${summary}" (ID: ${event.id})`
      }]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple Google Calendar MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new SimpleCalendarMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = SimpleCalendarMCP;