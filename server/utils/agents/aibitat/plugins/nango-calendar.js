// Import Nango SDK directly to avoid circular dependencies
const { Nango } = require("@nangohq/node");

/**
 * Nango Google Calendar Plugin for AnythingLLM Agent
 * Provides calendar access through Nango OAuth integration
 */
const nangoCalendar = {
  name: "nango-calendar",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    // Initialize Nango client
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || "https://api.nango.dev",
    });

    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: "check_calendar_events",
          controller: new AbortController(),
          description:
            "Get calendar events for a specific date or date range. Use this when user asks about their calendar, schedule, meetings, or availability.",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description:
                  "Date to check in YYYY-MM-DD format. Use 'today' for current date, 'tomorrow' for next day.",
              },
              days: {
                type: "number",
                description: "Number of days to look ahead (default: 1)",
                default: 1,
              },
            },
            required: ["date"],
          },
          handler: async function ({ date, days = 1 }) {
            try {
              this.super.introspect(
                `Checking calendar for ${date} (${days} days)`
              );

              // Get workspace ID from context
              const workspaceId =
                this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return "Unable to determine workspace context for calendar access.";
              }

              // Convert date string to proper format
              let startDate;
              if (date === "today") {
                startDate = new Date().toISOString().split("T")[0];
              } else if (date === "tomorrow") {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                startDate = tomorrow.toISOString().split("T")[0];
              } else {
                startDate = date;
              }

              // Calculate end date
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + days);
              const endDateStr = endDate.toISOString().split("T")[0];

              // Get events from Google Calendar via Nango
              const response = await nango.get({
                endpoint: `/calendar/v3/calendars/primary/events?timeMin=${startDate}T00:00:00Z&timeMax=${endDateStr}T23:59:59Z&orderBy=startTime&singleEvents=true`,
                connectionId: `workspace_${workspaceId}`,
                providerConfigKey: "google-calendar-getting-started",
              });

              const events = response.data?.items || [];

              if (events.length === 0) {
                return `No calendar events found for ${date}${days > 1 ? ` (${days} days)` : ""}.`;
              }

              // Format events for AI response
              const formattedEvents = events
                .map((event) => {
                  const startTime = event.start?.dateTime || event.start?.date;
                  const endTime = event.end?.dateTime || event.end?.date;
                  const title = event.summary || "Untitled Event";
                  const description = event.description
                    ? `\nDescription: ${event.description}`
                    : "";
                  const location = event.location
                    ? `\nLocation: ${event.location}`
                    : "";

                  return `• ${title}\n  Time: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}${description}${location}`;
                })
                .join("\n\n");

              return `Calendar events for ${date}${days > 1 ? ` (${days} days)` : ""}:\n\n${formattedEvents}`;
            } catch (error) {
              console.error(
                "[NangoCalendar] Error fetching calendar events:",
                error
              );
              this.super.introspect(`Calendar access failed: ${error.message}`);
              return `Sorry, I couldn't access your calendar right now. Error: ${error.message}`;
            }
          },
        });

        aibitat.function({
          super: aibitat,
          name: "create_calendar_event",
          controller: new AbortController(),
          description:
            "Create a new calendar event. Use this when user wants to schedule meetings, appointments, or reminders.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Event title/summary",
              },
              startTime: {
                type: "string",
                description: "Start time in ISO format (YYYY-MM-DDTHH:MM:SS)",
              },
              endTime: {
                type: "string",
                description: "End time in ISO format (YYYY-MM-DDTHH:MM:SS)",
              },
              description: {
                type: "string",
                description: "Event description (optional)",
              },
              location: {
                type: "string",
                description: "Event location (optional)",
              },
            },
            required: ["title", "startTime", "endTime"],
          },
          handler: async function ({
            title,
            startTime,
            endTime,
            description,
            location,
          }) {
            try {
              this.super.introspect(`Creating calendar event: ${title}`);

              const workspaceId =
                this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return "Unable to determine workspace context for calendar access.";
              }

              const eventData = {
                summary: title,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
                ...(description && { description }),
                ...(location && { location }),
              };

              const response = await nango.post({
                endpoint: "/calendar/v3/calendars/primary/events",
                connectionId: `workspace_${workspaceId}`,
                providerConfigKey: "google-calendar-getting-started",
                data: eventData,
              });

              if (response.data?.id) {
                return `✓ Calendar event created successfully: "${title}" on ${new Date(startTime).toLocaleString()}`;
              } else {
                return `Failed to create calendar event. Please try again.`;
              }
            } catch (error) {
              console.error(
                "[NangoCalendar] Error creating calendar event:",
                error
              );
              this.super.introspect(`Event creation failed: ${error.message}`);
              return `Sorry, I couldn't create the calendar event. Error: ${error.message}`;
            }
          },
        });
      },
    };
  },
};

module.exports = { nangoCalendar };
