#!/usr/bin/env node

/**
 * DHL Tracking MCP Server
 * Provides real-time shipment tracking via DHL API
 *
 * Environment Variables:
 * - DHL_API_KEY: DHL API key for authentication
 * - DHL_API_SECRET: DHL API secret (if required)
 */

const DHL_API_KEY = process.env.DHL_API_KEY || "demo_key";
const DHL_API_BASE = "https://api-eu.dhl.com/track/shipments";

// MCP Server implementation
class DHLTrackingServer {
  constructor() {
    this.name = "dhl-tracking";
    this.version = "1.0.0";
  }

  /**
   * Get tracking information for a single shipment
   */
  async getTrackingInfo(trackingNumber) {
    try {
      console.error(`[DHL MCP] Fetching tracking for: ${trackingNumber}`);

      // In production, this would make actual API call to DHL
      // For demo/development, return simulated data
      if (DHL_API_KEY === "demo_key") {
        return this.generateDemoTrackingData(trackingNumber);
      }

      // Real DHL API call
      const response = await fetch(
        `${DHL_API_BASE}?trackingNumber=${trackingNumber}`,
        {
          method: "GET",
          headers: {
            "DHL-API-Key": DHL_API_KEY,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatTrackingResponse(data);
    } catch (error) {
      console.error(`[DHL MCP] Error fetching tracking:`, error);
      throw error;
    }
  }

  /**
   * Track multiple shipments at once
   */
  async trackMultiple(trackingNumbers) {
    try {
      console.error(
        `[DHL MCP] Tracking multiple shipments: ${trackingNumbers.length}`
      );

      const results = await Promise.allSettled(
        trackingNumbers.map((num) => this.getTrackingInfo(num))
      );

      return results.map((result, idx) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            trackingNumber: trackingNumbers[idx],
            error: result.reason.message,
            status: "error",
          };
        }
      });
    } catch (error) {
      console.error(`[DHL MCP] Error tracking multiple:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to tracking updates (webhook simulation)
   */
  async subscribeToUpdates(trackingNumber, webhookUrl) {
    try {
      console.error(
        `[DHL MCP] Subscribing to updates for: ${trackingNumber} → ${webhookUrl}`
      );

      // In production, register webhook with DHL
      return {
        subscriptionId: `SUB-${Date.now()}`,
        trackingNumber: trackingNumber,
        webhookUrl: webhookUrl,
        status: "active",
        message: "Webhook subscription created (demo mode)",
      };
    } catch (error) {
      console.error(`[DHL MCP] Error subscribing:`, error);
      throw error;
    }
  }

  /**
   * Get estimated delivery date
   */
  async getEstimatedDelivery(trackingNumber) {
    try {
      const tracking = await this.getTrackingInfo(trackingNumber);
      return {
        trackingNumber: trackingNumber,
        estimatedDelivery: tracking.estimatedDelivery,
        confidence: tracking.deliveryConfidence || "medium",
      };
    } catch (error) {
      console.error(`[DHL MCP] Error getting delivery estimate:`, error);
      throw error;
    }
  }

  /**
   * Format tracking response to standard format
   */
  formatTrackingResponse(apiData) {
    // Transform DHL API response to our standard format
    return {
      trackingNumber: apiData.trackingNumber || apiData.id,
      carrier: "DHL",
      status: this.normalizeStatus(apiData.status),
      currentLocation: apiData.location?.address || "In Transit",
      lastUpdate: apiData.timestamp || new Date().toISOString(),
      estimatedDelivery: apiData.estimatedDelivery,
      deliveryConfidence: apiData.serviceArea?.confidenceLevel || "medium",
      events: apiData.events || [],
      origin: apiData.origin,
      destination: apiData.destination,
    };
  }

  /**
   * Normalize DHL status codes to standard values
   */
  normalizeStatus(dhlStatus) {
    const statusMap = {
      "pre-transit": "label_created",
      transit: "in_transit",
      delivered: "delivered",
      failure: "failed",
      unknown: "unknown",
      "out-for-delivery": "out_for_delivery",
      exception: "exception",
    };

    return statusMap[dhlStatus?.toLowerCase()] || "unknown";
  }

  /**
   * Generate demo tracking data for development
   */
  generateDemoTrackingData(trackingNumber) {
    const statuses = [
      "label_created",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const locations = [
      "Distribution Center - Los Angeles, CA",
      "Sorting Facility - Phoenix, AZ",
      "Regional Hub - Dallas, TX",
      "Local Facility - Destination City",
      "Out for Delivery - Destination Address",
    ];

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 1);

    return {
      trackingNumber: trackingNumber,
      carrier: "DHL",
      status: randomStatus,
      currentLocation: locations[Math.floor(Math.random() * locations.length)],
      lastUpdate: new Date().toISOString(),
      estimatedDelivery: futureDate.toISOString().split("T")[0],
      deliveryConfidence: "high",
      events: [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "label_created",
          location: "Origin Facility",
          description: "Shipment information received",
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "in_transit",
          location: "Distribution Center - Los Angeles, CA",
          description: "Package in transit",
        },
        {
          timestamp: new Date().toISOString(),
          status: randomStatus,
          location: locations[0],
          description: "Latest tracking update",
        },
      ],
      origin: {
        city: "San Diego",
        state: "CA",
        country: "US",
      },
      destination: {
        city: "Los Angeles",
        state: "CA",
        country: "US",
      },
    };
  }

  /**
   * Handle MCP tool calls
   */
  async handleToolCall(toolName, args) {
    console.error(`[DHL MCP] Tool call: ${toolName}`);

    switch (toolName) {
      case "get_tracking_info":
        if (!args.trackingNumber) {
          throw new Error("trackingNumber is required");
        }
        return await this.getTrackingInfo(args.trackingNumber);

      case "track_multiple":
        if (!args.trackingNumbers || !Array.isArray(args.trackingNumbers)) {
          throw new Error("trackingNumbers array is required");
        }
        return await this.trackMultiple(args.trackingNumbers);

      case "subscribe_to_updates":
        if (!args.trackingNumber || !args.webhookUrl) {
          throw new Error("trackingNumber and webhookUrl are required");
        }
        return await this.subscribeToUpdates(
          args.trackingNumber,
          args.webhookUrl
        );

      case "get_estimated_delivery":
        if (!args.trackingNumber) {
          throw new Error("trackingNumber is required");
        }
        return await this.getEstimatedDelivery(args.trackingNumber);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Get tool definitions for MCP protocol
   */
  getTools() {
    return [
      {
        name: "get_tracking_info",
        description:
          "Get real-time tracking information for a DHL shipment by tracking number",
        inputSchema: {
          type: "object",
          properties: {
            trackingNumber: {
              type: "string",
              description: "DHL tracking number (e.g., DHL123456789)",
            },
          },
          required: ["trackingNumber"],
        },
      },
      {
        name: "track_multiple",
        description: "Track multiple DHL shipments simultaneously",
        inputSchema: {
          type: "object",
          properties: {
            trackingNumbers: {
              type: "array",
              items: { type: "string" },
              description: "Array of DHL tracking numbers",
            },
          },
          required: ["trackingNumbers"],
        },
      },
      {
        name: "subscribe_to_updates",
        description:
          "Subscribe to real-time tracking updates via webhook (requires webhook URL)",
        inputSchema: {
          type: "object",
          properties: {
            trackingNumber: {
              type: "string",
              description: "DHL tracking number to monitor",
            },
            webhookUrl: {
              type: "string",
              description: "Webhook URL to receive updates",
            },
          },
          required: ["trackingNumber", "webhookUrl"],
        },
      },
      {
        name: "get_estimated_delivery",
        description: "Get estimated delivery date for a shipment",
        inputSchema: {
          type: "object",
          properties: {
            trackingNumber: {
              type: "string",
              description: "DHL tracking number",
            },
          },
          required: ["trackingNumber"],
        },
      },
    ];
  }
}

// MCP Server Protocol Handler
async function main() {
  const server = new DHLTrackingServer();

  console.error(`[DHL MCP] Server started - ${server.name} v${server.version}`);
  console.error(`[DHL MCP] API Key: ${DHL_API_KEY === "demo_key" ? "DEMO MODE" : "Configured"}`);

  // Handle stdin for MCP protocol
  process.stdin.setEncoding("utf8");

  let buffer = "";

  process.stdin.on("data", async (chunk) => {
    buffer += chunk;

    // Process complete JSON messages
    const lines = buffer.split("\n");
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        console.error(`[DHL MCP] Received message:`, message.method);

        let response;

        switch (message.method) {
          case "initialize":
            response = {
              jsonrpc: "2.0",
              id: message.id,
              result: {
                protocolVersion: "0.1.0",
                serverInfo: {
                  name: server.name,
                  version: server.version,
                },
                capabilities: {
                  tools: {},
                },
              },
            };
            break;

          case "tools/list":
            response = {
              jsonrpc: "2.0",
              id: message.id,
              result: {
                tools: server.getTools(),
              },
            };
            break;

          case "tools/call":
            try {
              const result = await server.handleToolCall(
                message.params.name,
                message.params.arguments || {}
              );
              response = {
                jsonrpc: "2.0",
                id: message.id,
                result: {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(result, null, 2),
                    },
                  ],
                },
              };
            } catch (error) {
              response = {
                jsonrpc: "2.0",
                id: message.id,
                error: {
                  code: -32603,
                  message: error.message,
                },
              };
            }
            break;

          default:
            response = {
              jsonrpc: "2.0",
              id: message.id,
              error: {
                code: -32601,
                message: `Method not found: ${message.method}`,
              },
            };
        }

        // Send response
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(`[DHL MCP] Error processing message:`, error);
      }
    }
  });

  process.stdin.on("end", () => {
    console.error("[DHL MCP] Server shutting down");
    process.exit(0);
  });
}

// Run server
if (require.main === module) {
  main().catch((error) => {
    console.error("[DHL MCP] Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { DHLTrackingServer };