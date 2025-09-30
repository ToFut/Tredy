#!/usr/bin/env node

/**
 * Stripe Payments MCP Server
 * Handles payment processing, invoicing, and refunds via Stripe API
 *
 * Environment Variables:
 * - STRIPE_SECRET_KEY: Stripe secret key for API authentication
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook secret for event verification
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_demo";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// MCP Server implementation
class StripePaymentsServer {
  constructor() {
    this.name = "stripe-payments";
    this.version = "1.0.0";
    this.stripe = null;

    // Initialize Stripe if key is available and not demo
    if (STRIPE_SECRET_KEY !== "sk_test_demo") {
      try {
        const Stripe = require("stripe");
        this.stripe = Stripe(STRIPE_SECRET_KEY);
        console.error("[Stripe MCP] Initialized with live Stripe API");
      } catch (error) {
        console.error("[Stripe MCP] Error loading Stripe SDK:", error.message);
        console.error("[Stripe MCP] Falling back to demo mode");
      }
    } else {
      console.error("[Stripe MCP] Running in DEMO mode (no real transactions)");
    }
  }

  /**
   * Create a payment intent for one-time payment
   */
  async createPayment({ amount, currency = "usd", description, metadata = {} }) {
    try {
      console.error(
        `[Stripe MCP] Creating payment: $${amount} ${currency.toUpperCase()}`
      );

      if (!this.stripe) {
        return this.generateDemoPayment({ amount, currency, description, metadata });
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        description: description,
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        description: description,
        created: new Date(paymentIntent.created * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error creating payment:", error);
      throw error;
    }
  }

  /**
   * Create an invoice for procurement orders
   */
  async createInvoice({
    customerId,
    items,
    dueDate,
    description,
    metadata = {},
  }) {
    try {
      console.error(`[Stripe MCP] Creating invoice for ${items.length} items`);

      if (!this.stripe) {
        return this.generateDemoInvoice({
          customerId,
          items,
          dueDate,
          description,
          metadata,
        });
      }

      // Create invoice items
      const invoiceItems = await Promise.all(
        items.map((item) =>
          this.stripe.invoiceItems.create({
            customer: customerId,
            amount: Math.round(item.amount * 100),
            currency: item.currency || "usd",
            description: item.description,
          })
        )
      );

      // Create invoice
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        description: description,
        due_date: dueDate
          ? Math.floor(new Date(dueDate).getTime() / 1000)
          : undefined,
        metadata: metadata,
        auto_advance: true,
      });

      // Finalize invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
        invoice.id
      );

      return {
        invoiceId: finalizedInvoice.id,
        invoiceNumber: finalizedInvoice.number,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoicePdf: finalizedInvoice.invoice_pdf,
        amount: finalizedInvoice.amount_due / 100,
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status,
        dueDate: dueDate,
        created: new Date(finalizedInvoice.created * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error creating invoice:", error);
      throw error;
    }
  }

  /**
   * Process a refund
   */
  async createRefund({ paymentIntentId, amount = null, reason = null }) {
    try {
      console.error(`[Stripe MCP] Creating refund for payment: ${paymentIntentId}`);

      if (!this.stripe) {
        return this.generateDemoRefund({ paymentIntentId, amount, reason });
      }

      const refundParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      if (reason) {
        refundParams.reason = reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        refundId: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: new Date(refund.created * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error creating refund:", error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus({ paymentIntentId }) {
    try {
      console.error(`[Stripe MCP] Getting status for: ${paymentIntentId}`);

      if (!this.stripe) {
        return this.generateDemoPaymentStatus({ paymentIntentId });
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      return {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        description: paymentIntent.description,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        charges: paymentIntent.charges.data.map((charge) => ({
          id: charge.id,
          amount: charge.amount / 100,
          status: charge.status,
          paid: charge.paid,
          receiptUrl: charge.receipt_url,
        })),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error getting payment status:", error);
      throw error;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer({ email, name, metadata = {} }) {
    try {
      console.error(`[Stripe MCP] Creating customer: ${email}`);

      if (!this.stripe) {
        return this.generateDemoCustomer({ email, name, metadata });
      }

      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: metadata,
      });

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        created: new Date(customer.created * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error creating customer:", error);
      throw error;
    }
  }

  /**
   * Set up recurring subscription
   */
  async createSubscription({
    customerId,
    priceId,
    quantity = 1,
    metadata = {},
  }) {
    try {
      console.error(`[Stripe MCP] Creating subscription for: ${customerId}`);

      if (!this.stripe) {
        return this.generateDemoSubscription({
          customerId,
          priceId,
          quantity,
          metadata,
        });
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: quantity }],
        metadata: metadata,
      });

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        created: new Date(subscription.created * 1000).toISOString(),
      };
    } catch (error) {
      console.error("[Stripe MCP] Error creating subscription:", error);
      throw error;
    }
  }

  // ============================================================
  // DEMO MODE GENERATORS (for development without Stripe keys)
  // ============================================================

  generateDemoPayment({ amount, currency, description, metadata }) {
    return {
      paymentId: `pi_demo_${Date.now()}`,
      clientSecret: `demo_secret_${Date.now()}`,
      amount: amount,
      currency: currency,
      status: "succeeded",
      description: description,
      created: new Date().toISOString(),
      mode: "DEMO",
    };
  }

  generateDemoInvoice({ customerId, items, dueDate, description, metadata }) {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      invoiceId: `in_demo_${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      hostedInvoiceUrl: `https://invoice.stripe.com/i/demo_${Date.now()}`,
      invoicePdf: `https://invoice.stripe.com/i/demo_${Date.now()}/pdf`,
      amount: totalAmount,
      currency: items[0]?.currency || "usd",
      status: "open",
      dueDate: dueDate,
      created: new Date().toISOString(),
      mode: "DEMO",
    };
  }

  generateDemoRefund({ paymentIntentId, amount, reason }) {
    return {
      refundId: `re_demo_${Date.now()}`,
      paymentIntentId: paymentIntentId,
      amount: amount || 0,
      currency: "usd",
      status: "succeeded",
      reason: reason || "requested_by_customer",
      created: new Date().toISOString(),
      mode: "DEMO",
    };
  }

  generateDemoPaymentStatus({ paymentIntentId }) {
    return {
      paymentId: paymentIntentId,
      amount: 1000,
      currency: "usd",
      status: "succeeded",
      description: "Demo payment",
      created: new Date().toISOString(),
      charges: [
        {
          id: `ch_demo_${Date.now()}`,
          amount: 1000,
          status: "succeeded",
          paid: true,
          receiptUrl: `https://receipt.stripe.com/demo_${Date.now()}`,
        },
      ],
      mode: "DEMO",
    };
  }

  generateDemoCustomer({ email, name, metadata }) {
    return {
      customerId: `cus_demo_${Date.now()}`,
      email: email,
      name: name,
      created: new Date().toISOString(),
      mode: "DEMO",
    };
  }

  generateDemoSubscription({ customerId, priceId, quantity, metadata }) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return {
      subscriptionId: `sub_demo_${Date.now()}`,
      customerId: customerId,
      status: "active",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      created: now.toISOString(),
      mode: "DEMO",
    };
  }

  // ============================================================
  // MCP PROTOCOL HANDLERS
  // ============================================================

  async handleToolCall(toolName, args) {
    console.error(`[Stripe MCP] Tool call: ${toolName}`);

    switch (toolName) {
      case "create_payment":
        if (!args.amount) {
          throw new Error("amount is required");
        }
        return await this.createPayment(args);

      case "create_invoice":
        if (!args.items || !Array.isArray(args.items)) {
          throw new Error("items array is required");
        }
        return await this.createInvoice(args);

      case "create_refund":
        if (!args.paymentIntentId) {
          throw new Error("paymentIntentId is required");
        }
        return await this.createRefund(args);

      case "get_payment_status":
        if (!args.paymentIntentId) {
          throw new Error("paymentIntentId is required");
        }
        return await this.getPaymentStatus(args);

      case "create_customer":
        if (!args.email) {
          throw new Error("email is required");
        }
        return await this.createCustomer(args);

      case "create_subscription":
        if (!args.customerId || !args.priceId) {
          throw new Error("customerId and priceId are required");
        }
        return await this.createSubscription(args);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getTools() {
    return [
      {
        name: "create_payment",
        description:
          "Create a one-time payment via Stripe for procurement purchase orders",
        inputSchema: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description: "Payment amount in dollars (e.g., 1500.50)",
            },
            currency: {
              type: "string",
              description: "Currency code (default: usd)",
              default: "usd",
            },
            description: {
              type: "string",
              description: "Payment description (e.g., 'PO-12345')",
            },
            metadata: {
              type: "object",
              description: "Additional metadata to attach to payment",
            },
          },
          required: ["amount"],
        },
      },
      {
        name: "create_invoice",
        description:
          "Create an invoice for procurement orders with multiple line items",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Stripe customer ID",
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  currency: { type: "string" },
                  description: { type: "string" },
                },
              },
              description: "Array of invoice line items",
            },
            dueDate: {
              type: "string",
              description: "Invoice due date (YYYY-MM-DD)",
            },
            description: {
              type: "string",
              description: "Invoice description",
            },
            metadata: {
              type: "object",
              description: "Additional metadata",
            },
          },
          required: ["items"],
        },
      },
      {
        name: "create_refund",
        description: "Process a refund for a payment",
        inputSchema: {
          type: "object",
          properties: {
            paymentIntentId: {
              type: "string",
              description: "Stripe Payment Intent ID to refund",
            },
            amount: {
              type: "number",
              description:
                "Refund amount in dollars (leave empty for full refund)",
            },
            reason: {
              type: "string",
              enum: ["duplicate", "fraudulent", "requested_by_customer"],
              description: "Reason for refund",
            },
          },
          required: ["paymentIntentId"],
        },
      },
      {
        name: "get_payment_status",
        description: "Get the status of a payment",
        inputSchema: {
          type: "object",
          properties: {
            paymentIntentId: {
              type: "string",
              description: "Stripe Payment Intent ID",
            },
          },
          required: ["paymentIntentId"],
        },
      },
      {
        name: "create_customer",
        description: "Create a Stripe customer for procurement suppliers",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Customer email address",
            },
            name: {
              type: "string",
              description: "Customer name",
            },
            metadata: {
              type: "object",
              description: "Additional customer metadata",
            },
          },
          required: ["email"],
        },
      },
      {
        name: "create_subscription",
        description: "Create a recurring subscription for ongoing procurement",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Stripe customer ID",
            },
            priceId: {
              type: "string",
              description: "Stripe price ID for subscription",
            },
            quantity: {
              type: "number",
              description: "Subscription quantity (default: 1)",
              default: 1,
            },
            metadata: {
              type: "object",
              description: "Additional metadata",
            },
          },
          required: ["customerId", "priceId"],
        },
      },
    ];
  }
}

// MCP Server Protocol Handler
async function main() {
  const server = new StripePaymentsServer();

  console.error(
    `[Stripe MCP] Server started - ${server.name} v${server.version}`
  );
  console.error(
    `[Stripe MCP] Mode: ${server.stripe ? "LIVE (Real API)" : "DEMO (Simulated)"}`
  );

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
        console.error(`[Stripe MCP] Received message:`, message.method);

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
        console.error(`[Stripe MCP] Error processing message:`, error);
      }
    }
  });

  process.stdin.on("end", () => {
    console.error("[Stripe MCP] Server shutting down");
    process.exit(0);
  });
}

// Run server
if (require.main === module) {
  main().catch((error) => {
    console.error("[Stripe MCP] Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { StripePaymentsServer };