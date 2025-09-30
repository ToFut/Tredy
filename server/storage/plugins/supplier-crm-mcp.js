#!/usr/bin/env node

/**
 * Supplier CRM MCP Server
 * Manages supplier database, contact information, and communication history
 *
 * In production, this could connect to:
 * - External CRM API (Salesforce, HubSpot, etc.)
 * - Internal supplier database
 * - CSV/Excel supplier lists uploaded to workspace
 *
 * For demo: Uses in-memory supplier database
 */

const { Document } = require("../../../models/documents");

class SupplierCRMServer {
  constructor() {
    this.name = "supplier-crm";
    this.version = "1.0.0";

    // Demo supplier database
    this.suppliers = this.initializeDemoSuppliers();
  }

  /**
   * Initialize demo supplier database
   */
  initializeDemoSuppliers() {
    return [
      {
        id: "SUP_001",
        name: "West Coast Hospitality Furnishings",
        location: {
          city: "San Diego",
          state: "CA",
          country: "US",
          address: "1234 Industrial Blvd, San Diego, CA 92101",
        },
        specialties: ["Furniture", "Textiles"],
        categories: ["Furniture", "Textiles", "Lighting"],
        maxOrderValue: 500000,
        capacity: "Large (500+ rooms/year)",
        leadTimeWeeks: "6-8",
        certifications: ["CAL 117-2013", "FSC Certified", "GREENGUARD"],
        contacts: [
          {
            name: "Sarah Johnson",
            role: "Procurement Manager",
            email: "procurement@wchosp.com",
            phone: "(619) 555-0100",
            primary: true,
          },
          {
            name: "Mike Chen",
            role: "Account Executive",
            email: "mchen@wchosp.com",
            phone: "(619) 555-0101",
            primary: false,
          },
        ],
        rating: 4.8,
        yearsInBusiness: 15,
        previousOrders: 23,
        totalRevenue: 1250000,
        paymentTerms: "Net 30",
        shippingMethods: ["Ground", "Express", "White Glove"],
        website: "https://wchosp.com",
        notes: "Preferred supplier for luxury hotel furniture. Excellent quality and on-time delivery.",
      },
      {
        id: "SUP_002",
        name: "Premier Bath & Fixtures Inc",
        location: {
          city: "Phoenix",
          state: "AZ",
          country: "US",
          address: "567 Commerce St, Phoenix, AZ 85001",
        },
        specialties: ["Bathroom"],
        categories: ["Bathroom", "Plumbing", "Fixtures"],
        maxOrderValue: 200000,
        capacity: "Medium (200 rooms/year)",
        leadTimeWeeks: "4-6",
        certifications: ["ADA Compliant", "WaterSense", "UPC Listed"],
        contacts: [
          {
            name: "David Martinez",
            role: "Sales Director",
            email: "quotes@premierbath.com",
            phone: "(602) 555-0200",
            primary: true,
          },
        ],
        rating: 4.6,
        yearsInBusiness: 12,
        previousOrders: 18,
        totalRevenue: 780000,
        paymentTerms: "Net 30",
        shippingMethods: ["Ground", "Freight"],
        website: "https://premierbath.com",
        notes: "Specializes in ADA-compliant bathroom fixtures. Strong on compliance documentation.",
      },
      {
        id: "SUP_003",
        name: "TechComfort Electronics",
        location: {
          city: "Seattle",
          state: "WA",
          country: "US",
          address: "890 Tech Drive, Seattle, WA 98101",
        },
        specialties: ["Electronics"],
        categories: ["Electronics", "HVAC", "Appliances"],
        maxOrderValue: 300000,
        capacity: "Large (1000+ units/month)",
        leadTimeWeeks: "3-4",
        certifications: ["UL Listed", "Energy Star", "CE Certified"],
        contacts: [
          {
            name: "Jennifer Lee",
            role: "Commercial Sales Manager",
            email: "sales@techcomfort.com",
            phone: "(206) 555-0300",
            primary: true,
          },
        ],
        rating: 4.7,
        yearsInBusiness: 10,
        previousOrders: 31,
        totalRevenue: 2100000,
        paymentTerms: "Net 30",
        shippingMethods: ["Ground", "Express"],
        website: "https://techcomfort.com",
        notes: "Fast turnaround on electronics. Energy-efficient products.",
      },
      {
        id: "SUP_004",
        name: "Illuminate Design Group",
        location: {
          city: "Los Angeles",
          state: "CA",
          country: "US",
          address: "456 Design Plaza, Los Angeles, CA 90001",
        },
        specialties: ["Lighting"],
        categories: ["Lighting", "Electrical"],
        maxOrderValue: 250000,
        capacity: "Medium (300 rooms/year)",
        leadTimeWeeks: "5-7",
        certifications: ["UL Listed", "DLC Certified", "Title 24 Compliant"],
        contacts: [
          {
            name: "Robert Kim",
            role: "Project Manager",
            email: "projects@illuminatedesign.com",
            phone: "(310) 555-0400",
            primary: true,
          },
        ],
        rating: 4.9,
        yearsInBusiness: 20,
        previousOrders: 27,
        totalRevenue: 1850000,
        paymentTerms: "Net 45",
        shippingMethods: ["Ground", "White Glove"],
        website: "https://illuminatedesign.com",
        notes: "Premium lighting designer. Custom solutions available. Excellent customer service.",
      },
      {
        id: "SUP_005",
        name: "Luxury Linens & Textiles Co",
        location: {
          city: "Dallas",
          state: "TX",
          country: "US",
          address: "789 Textile Way, Dallas, TX 75201",
        },
        specialties: ["Textiles"],
        categories: ["Textiles", "Bedding", "Window Treatments"],
        maxOrderValue: 150000,
        capacity: "Large (500+ rooms/year)",
        leadTimeWeeks: "6-8",
        certifications: ["Oeko-Tex", "Organic Cotton", "Fire Retardant"],
        contacts: [
          {
            name: "Amanda White",
            role: "Hospitality Sales Lead",
            email: "hospitality@luxurylinens.com",
            phone: "(214) 555-0500",
            primary: true,
          },
        ],
        rating: 4.5,
        yearsInBusiness: 18,
        previousOrders: 22,
        totalRevenue: 980000,
        paymentTerms: "Net 30",
        shippingMethods: ["Ground", "Express"],
        website: "https://luxurylinens.com",
        notes: "High-quality textiles for luxury hotels. Wide selection of fabrics.",
      },
      {
        id: "SUP_006",
        name: "National Furniture Distributors",
        location: {
          city: "Chicago",
          state: "IL",
          country: "US",
          address: "123 Distribution Center, Chicago, IL 60601",
        },
        specialties: ["Furniture"],
        categories: ["Furniture", "Outdoor Furniture", "Lobby Furniture"],
        maxOrderValue: 750000,
        capacity: "Enterprise (2000+ rooms/year)",
        leadTimeWeeks: "8-10",
        certifications: ["CAL 117-2013", "BIFMA", "ISO 9001"],
        contacts: [
          {
            name: "Thomas Anderson",
            role: "VP Commercial Sales",
            email: "commercial@nationalfurn.com",
            phone: "(312) 555-0600",
            primary: true,
          },
          {
            name: "Lisa Brown",
            role: "Customer Success Manager",
            email: "lbrown@nationalfurn.com",
            phone: "(312) 555-0601",
            primary: false,
          },
        ],
        rating: 4.4,
        yearsInBusiness: 25,
        previousOrders: 45,
        totalRevenue: 5200000,
        paymentTerms: "Net 60",
        shippingMethods: ["Ground", "Freight", "White Glove"],
        website: "https://nationalfurn.com",
        notes: "Largest supplier network. Can handle enterprise-scale orders. Volume discounts available.",
      },
    ];
  }

  /**
   * List all suppliers, optionally filtered by categories
   */
  async listSuppliers({ categories = [], minRating = 0, state = null }) {
    try {
      console.error(`[Supplier CRM] Listing suppliers with filters`);

      let results = [...this.suppliers];

      // Filter by categories
      if (categories.length > 0) {
        results = results.filter((supplier) =>
          supplier.categories.some((cat) =>
            categories.some((filterCat) =>
              cat.toLowerCase().includes(filterCat.toLowerCase())
            )
          )
        );
      }

      // Filter by minimum rating
      if (minRating > 0) {
        results = results.filter((supplier) => supplier.rating >= minRating);
      }

      // Filter by state
      if (state) {
        results = results.filter(
          (supplier) =>
            supplier.location.state.toLowerCase() === state.toLowerCase()
        );
      }

      console.error(`[Supplier CRM] Found ${results.length} suppliers`);
      return results;
    } catch (error) {
      console.error("[Supplier CRM] Error listing suppliers:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific supplier
   */
  async getSupplier({ supplierId }) {
    try {
      console.error(`[Supplier CRM] Getting supplier: ${supplierId}`);

      const supplier = this.suppliers.find((s) => s.id === supplierId);

      if (!supplier) {
        throw new Error(`Supplier not found: ${supplierId}`);
      }

      return supplier;
    } catch (error) {
      console.error("[Supplier CRM] Error getting supplier:", error);
      throw error;
    }
  }

  /**
   * Search suppliers by name or category
   */
  async searchSuppliers({ query }) {
    try {
      console.error(`[Supplier CRM] Searching for: ${query}`);

      const lowerQuery = query.toLowerCase();

      const results = this.suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(lowerQuery) ||
          supplier.categories.some((cat) =>
            cat.toLowerCase().includes(lowerQuery)
          ) ||
          supplier.specialties.some((spec) =>
            spec.toLowerCase().includes(lowerQuery)
          ) ||
          supplier.location.city.toLowerCase().includes(lowerQuery) ||
          supplier.location.state.toLowerCase().includes(lowerQuery)
      );

      console.error(`[Supplier CRM] Found ${results.length} matching suppliers`);
      return results;
    } catch (error) {
      console.error("[Supplier CRM] Error searching suppliers:", error);
      throw error;
    }
  }

  /**
   * Get supplier contact information
   */
  async getSupplierContacts({ supplierId }) {
    try {
      console.error(`[Supplier CRM] Getting contacts for: ${supplierId}`);

      const supplier = await this.getSupplier({ supplierId });
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        contacts: supplier.contacts,
      };
    } catch (error) {
      console.error("[Supplier CRM] Error getting contacts:", error);
      throw error;
    }
  }

  /**
   * Add a new supplier to the database
   */
  async addSupplier({ supplierData }) {
    try {
      console.error(`[Supplier CRM] Adding new supplier: ${supplierData.name}`);

      const newSupplier = {
        id: `SUP_${String(this.suppliers.length + 1).padStart(3, "0")}`,
        ...supplierData,
        rating: supplierData.rating || 0,
        previousOrders: 0,
        totalRevenue: 0,
      };

      this.suppliers.push(newSupplier);

      console.error(`[Supplier CRM] Added supplier: ${newSupplier.id}`);
      return newSupplier;
    } catch (error) {
      console.error("[Supplier CRM] Error adding supplier:", error);
      throw error;
    }
  }

  /**
   * Update supplier information
   */
  async updateSupplier({ supplierId, updates }) {
    try {
      console.error(`[Supplier CRM] Updating supplier: ${supplierId}`);

      const supplierIndex = this.suppliers.findIndex((s) => s.id === supplierId);

      if (supplierIndex === -1) {
        throw new Error(`Supplier not found: ${supplierId}`);
      }

      this.suppliers[supplierIndex] = {
        ...this.suppliers[supplierIndex],
        ...updates,
      };

      console.error(`[Supplier CRM] Updated supplier: ${supplierId}`);
      return this.suppliers[supplierIndex];
    } catch (error) {
      console.error("[Supplier CRM] Error updating supplier:", error);
      throw error;
    }
  }

  /**
   * Get suppliers by proximity to a location
   */
  async getSuppliersByProximity({ location, maxDistance = null }) {
    try {
      console.error(`[Supplier CRM] Finding suppliers near: ${location}`);

      // Parse location (expected format: "City, State" or just "State")
      const statePart = location.includes(",")
        ? location.split(",")[1].trim()
        : location.trim();

      // US Regions mapping
      const regions = {
        West: ["CA", "OR", "WA", "NV", "AZ", "UT", "CO", "ID", "MT", "WY"],
        Midwest: [
          "IL",
          "OH",
          "MI",
          "IN",
          "WI",
          "MN",
          "MO",
          "IA",
          "KS",
          "NE",
          "SD",
          "ND",
        ],
        South: [
          "TX",
          "FL",
          "GA",
          "NC",
          "SC",
          "VA",
          "TN",
          "AL",
          "MS",
          "LA",
          "AR",
          "OK",
          "KY",
          "WV",
        ],
        Northeast: [
          "NY",
          "PA",
          "NJ",
          "MA",
          "CT",
          "RI",
          "ME",
          "NH",
          "VT",
          "DE",
          "MD",
        ],
      };

      // Find region for the location
      let locationRegion = null;
      for (const [region, states] of Object.entries(regions)) {
        if (states.includes(statePart.toUpperCase())) {
          locationRegion = region;
          break;
        }
      }

      // Score suppliers by proximity
      const scoredSuppliers = this.suppliers.map((supplier) => {
        let proximityScore = 25; // Default (different region)

        if (supplier.location.state.toUpperCase() === statePart.toUpperCase()) {
          proximityScore = 100; // Same state
        } else if (locationRegion) {
          const supplierRegion = Object.keys(regions).find((region) =>
            regions[region].includes(supplier.location.state)
          );
          if (supplierRegion === locationRegion) {
            proximityScore = 75; // Same region
          }
        }

        return {
          ...supplier,
          proximityScore: proximityScore,
        };
      });

      // Sort by proximity score (descending)
      scoredSuppliers.sort((a, b) => b.proximityScore - a.proximityScore);

      console.error(
        `[Supplier CRM] Found ${scoredSuppliers.length} suppliers sorted by proximity`
      );
      return scoredSuppliers;
    } catch (error) {
      console.error("[Supplier CRM] Error getting suppliers by proximity:", error);
      throw error;
    }
  }

  // ============================================================
  // MCP PROTOCOL HANDLERS
  // ============================================================

  async handleToolCall(toolName, args) {
    console.error(`[Supplier CRM] Tool call: ${toolName}`);

    switch (toolName) {
      case "list_suppliers":
        return await this.listSuppliers(args);

      case "get_supplier":
        if (!args.supplierId) {
          throw new Error("supplierId is required");
        }
        return await this.getSupplier(args);

      case "search_suppliers":
        if (!args.query) {
          throw new Error("query is required");
        }
        return await this.searchSuppliers(args);

      case "get_supplier_contacts":
        if (!args.supplierId) {
          throw new Error("supplierId is required");
        }
        return await this.getSupplierContacts(args);

      case "add_supplier":
        if (!args.supplierData) {
          throw new Error("supplierData is required");
        }
        return await this.addSupplier(args);

      case "update_supplier":
        if (!args.supplierId || !args.updates) {
          throw new Error("supplierId and updates are required");
        }
        return await this.updateSupplier(args);

      case "get_suppliers_by_proximity":
        if (!args.location) {
          throw new Error("location is required");
        }
        return await this.getSuppliersByProximity(args);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getTools() {
    return [
      {
        name: "list_suppliers",
        description:
          "List all suppliers, optionally filtered by categories, minimum rating, or state",
        inputSchema: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: { type: "string" },
              description:
                "Filter by categories (e.g., ['Furniture', 'Lighting'])",
            },
            minRating: {
              type: "number",
              description: "Minimum supplier rating (0-5)",
            },
            state: {
              type: "string",
              description: "Filter by US state code (e.g., 'CA', 'TX')",
            },
          },
        },
      },
      {
        name: "get_supplier",
        description: "Get detailed information about a specific supplier by ID",
        inputSchema: {
          type: "object",
          properties: {
            supplierId: {
              type: "string",
              description: "Supplier ID (e.g., 'SUP_001')",
            },
          },
          required: ["supplierId"],
        },
      },
      {
        name: "search_suppliers",
        description:
          "Search suppliers by name, category, specialty, or location",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'furniture', 'California', 'lighting')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_supplier_contacts",
        description: "Get contact information for a supplier",
        inputSchema: {
          type: "object",
          properties: {
            supplierId: {
              type: "string",
              description: "Supplier ID",
            },
          },
          required: ["supplierId"],
        },
      },
      {
        name: "add_supplier",
        description: "Add a new supplier to the database",
        inputSchema: {
          type: "object",
          properties: {
            supplierData: {
              type: "object",
              description: "Supplier information object",
            },
          },
          required: ["supplierData"],
        },
      },
      {
        name: "update_supplier",
        description: "Update supplier information",
        inputSchema: {
          type: "object",
          properties: {
            supplierId: {
              type: "string",
              description: "Supplier ID to update",
            },
            updates: {
              type: "object",
              description: "Fields to update",
            },
          },
          required: ["supplierId", "updates"],
        },
      },
      {
        name: "get_suppliers_by_proximity",
        description:
          "Get suppliers sorted by proximity to a location (same state > same region > different region)",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Location (e.g., 'Los Angeles, CA' or 'CA')",
            },
            maxDistance: {
              type: "number",
              description: "Maximum distance in miles (optional)",
            },
          },
          required: ["location"],
        },
      },
    ];
  }
}

// MCP Server Protocol Handler
async function main() {
  const server = new SupplierCRMServer();

  console.error(`[Supplier CRM] Server started - ${server.name} v${server.version}`);
  console.error(`[Supplier CRM] Demo database loaded with ${server.suppliers.length} suppliers`);

  // Handle stdin for MCP protocol
  process.stdin.setEncoding("utf8");

  let buffer = "";

  process.stdin.on("data", async (chunk) => {
    buffer += chunk;

    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        console.error(`[Supplier CRM] Received message:`, message.method);

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

        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(`[Supplier CRM] Error processing message:`, error);
      }
    }
  });

  process.stdin.on("end", () => {
    console.error("[Supplier CRM] Server shutting down");
    process.exit(0);
  });
}

// Run server
if (require.main === module) {
  main().catch((error) => {
    console.error("[Supplier CRM] Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { SupplierCRMServer };