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
          description: 'Book a meeting, create calendar event, schedule appointment, send meeting invite in Google Calendar. Use this when user asks to: book meeting, schedule event, send calendar invite, create appointment, invite someone to meeting.',
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
              },
              attendees: {
                type: 'array',
                description: 'List of attendee email addresses to invite (optional)',
                items: {
                  type: 'string'
                }
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

    // Parse natural language dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateStr === 'today') {
        return today.toISOString();
      } else if (dateStr === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
      } else if (dateStr === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString();
      } else if (dateStr.includes('T')) {
        // Already ISO format
        return dateStr;
      } else {
        // Try to parse as date
        const parsed = new Date(dateStr);
        return isNaN(parsed) ? null : parsed.toISOString();
      }
    };

    // Better date handling with proper ISO format
    const now = new Date();
    const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    let {
      timeMin = defaultTimeMin,
      timeMax,
      maxResults = 10
    } = args;

    // Parse dates if they're natural language
    if (timeMin) {
      const parsed = parseDate(timeMin);
      if (parsed) timeMin = parsed;
    }
    if (timeMax) {
      const parsed = parseDate(timeMax);
      if (parsed) timeMax = parsed;
    }

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
    
    try {
      // Use Nango's proxy to make the API call
      // Get connection ID from environment (set by MCP bridge)
      const connectionId = process.env.NANGO_CONNECTION_ID;
      if (!connectionId) {
        throw new Error('NANGO_CONNECTION_ID not set. Calendar not connected for this workspace.');
      }
      
      const response = await nango.get({
        endpoint,
        connectionId,
        providerConfigKey: process.env.NANGO_PROVIDER_CONFIG_KEY || 'google-calendar-getting-started'
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
    } catch (error) {
      console.error('Calendar API Error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Error fetching calendar events: ${error.response?.data?.error?.message || error.message}`
        }],
        isError: true
      };
    }
  }

  async createCalendarEvent(args) {
    // Use Nango for creating events too
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    // Parse natural language dates
    const parseDateTime = (dateStr, isEndTime = false) => {
      if (!dateStr) return null;
      
      const now = new Date();
      
      // Handle common natural language inputs
      if (dateStr === 'today' || dateStr === 'now') {
        return now.toISOString();
      } else if (dateStr === 'tomorrow') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (isEndTime) {
          tomorrow.setHours(tomorrow.getHours() + 1); // Default 1 hour duration
        }
        return tomorrow.toISOString();
      } else if (dateStr.includes('T')) {
        // Already ISO format
        return dateStr;
      } else {
        // Try to parse as date
        const parsed = new Date(dateStr);
        if (!isNaN(parsed)) {
          return parsed.toISOString();
        }
        // Default to tomorrow at 3pm if can't parse
        const defaultDate = new Date(now);
        defaultDate.setDate(defaultDate.getDate() + 1);
        defaultDate.setHours(15, 0, 0, 0); // 3pm
        if (isEndTime) {
          defaultDate.setHours(16, 0, 0, 0); // 4pm
        }
        return defaultDate.toISOString();
      }
    };

    const { summary, startTime, endTime, description, location, attendees } = args;
    
    // If no start time provided, default to tomorrow at 3pm
    const defaultStartTime = (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);
      return tomorrow.toISOString();
    })();
    
    // Parse and validate times
    const parsedStartTime = parseDateTime(startTime || defaultStartTime);
    
    // If no end time, make it 1 hour after start
    const parsedEndTime = (() => {
      if (endTime) {
        return parseDateTime(endTime, true);
      } else {
        const end = new Date(parsedStartTime);
        end.setHours(end.getHours() + 1);
        return end.toISOString();
      }
    })();
    
    console.error('[Calendar MCP] Creating event:', { 
      summary, 
      startTime: parsedStartTime, 
      endTime: parsedEndTime,
      attendees 
    });

    // Ensure both dates are in the same format (dateTime with timezone)
    const eventData = {
      summary: summary || 'Meeting',
      start: { 
        dateTime: parsedStartTime,
        timeZone: 'America/New_York'  // Add timezone to be explicit
      },
      end: { 
        dateTime: parsedEndTime,
        timeZone: 'America/New_York'  // Add timezone to be explicit
      },
      ...(description && { description }),
      ...(location && { location }),
      ...(attendees && attendees.length > 0 && { 
        attendees: attendees.map(email => ({ email }))
      })
    };

    // Use Nango's proxy to create the event
    try {
      const response = await nango.post({
        endpoint: '/calendar/v3/calendars/primary/events',
        connectionId: process.env.NANGO_CONNECTION_ID,
        providerConfigKey: 'google-calendar-getting-started',
        data: eventData
      });

      const event = response.data;
      
      // Build a more informative success message
      let successMsg = `✓ Calendar event created successfully!\n`;
      successMsg += `📅 "${eventData.summary}"\n`;
      successMsg += `⏰ ${new Date(parsedStartTime).toLocaleString()}\n`;
      if (attendees && attendees.length > 0) {
        successMsg += `👥 Invited: ${attendees.join(', ')}\n`;
      }
      successMsg += `🔗 Event ID: ${event.id}`;
      
      return {
        content: [{
          type: 'text',
          text: successMsg
        }]
      };
    } catch (error) {
      console.error('[Calendar MCP] Error creating event:', error.response?.data || error.message);
      throw new Error(`Failed to create calendar event: ${error.response?.data?.error?.message || error.message}`);
    }
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