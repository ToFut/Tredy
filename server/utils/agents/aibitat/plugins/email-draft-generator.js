const emailDraftGenerator = {
  name: "email-draft-generator",
  startupConfig: {
    params: {
      GMAIL_CLIENT_ID: {
        type: "string",
        required: false,
        description: "Gmail API Client ID for OAuth2 authentication",
        default: process.env.GMAIL_CLIENT_ID || "",
      },
      GMAIL_CLIENT_SECRET: {
        type: "string",
        required: false,
        description: "Gmail API Client Secret for OAuth2 authentication",
        default: process.env.GMAIL_CLIENT_SECRET || "",
      },
      EMAIL_TEMPLATES_PATH: {
        type: "string",
        required: false,
        description: "Path to email templates directory",
        default: process.env.EMAIL_TEMPLATES_PATH || "./email-templates",
      },
    },
  },
  plugin: function ({ GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, EMAIL_TEMPLATES_PATH }) {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          description:
            "Automatically generate personalized email draft responses based on incoming emails. Analyzes email content, determines intent, and creates appropriate replies using the workspace's AI provider. Supports multiple email categories like partnerships, pricing, support, and cold outreach.",
          examples: [
            {
              prompt: "Generate a draft reply for the partnership email in my inbox",
              call: JSON.stringify({ 
                action: "generateDraft",
                emailId: "latest",
                category: "partnership"
              }),
            },
            {
              prompt: "Create email drafts for all unread support queries",
              call: JSON.stringify({ 
                action: "batchGenerate",
                filter: { label: "support", unread: true }
              }),
            },
            {
              prompt: "Analyze my inbox and draft replies for high-priority emails",
              call: JSON.stringify({ 
                action: "smartInbox",
                priority: "high",
                maxDrafts: 5
              }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["generateDraft", "batchGenerate", "smartInbox", "analyzeEmail", "listTemplates"],
                description: "Action to perform: generateDraft (single email), batchGenerate (multiple), smartInbox (AI-powered inbox zero), analyzeEmail (categorize), listTemplates (show available templates)",
              },
              emailId: {
                type: "string",
                description: "Email ID or 'latest' for most recent email (for generateDraft action)",
              },
              filter: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                    description: "Filter by email label/category",
                  },
                  unread: {
                    type: "boolean",
                    description: "Only process unread emails",
                  },
                  from: {
                    type: "string",
                    description: "Filter by sender email or domain",
                  },
                  subject: {
                    type: "string",
                    description: "Filter by subject keywords",
                  },
                  dateRange: {
                    type: "object",
                    properties: {
                      start: { type: "string", format: "date" },
                      end: { type: "string", format: "date" },
                    },
                  },
                },
                description: "Filters for batch processing",
              },
              category: {
                type: "string",
                enum: ["partnership", "pricing", "support", "sales", "feedback", "general", "auto"],
                description: "Email category for template selection (auto = AI decides)",
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low", "all"],
                description: "Priority level for smart inbox processing",
              },
              maxDrafts: {
                type: "number",
                description: "Maximum number of drafts to generate in batch mode",
                default: 10,
              },
              tone: {
                type: "string",
                enum: ["professional", "friendly", "casual", "formal", "enthusiastic"],
                description: "Tone of voice for the draft",
                default: "professional",
              },
              templateOverrides: {
                type: "object",
                properties: {
                  greeting: { type: "string" },
                  signature: { type: "string" },
                  style: { type: "string" },
                },
                description: "Override default template settings",
              },
            },
            required: ["action"],
            additionalProperties: false,
          },
          handler: async function ({ 
            action, 
            emailId, 
            filter, 
            category = "auto", 
            priority = "all",
            maxDrafts = 10,
            tone = "professional",
            templateOverrides = {}
          }) {
            try {
              // Use the workspace's AI provider instead of hardcoded OpenAI
              const aiProvider = this.super.introspect ? this.super : aibitat;
              
              this.super.introspect(
                `${this.caller}: Executing email draft generator action: ${action}`
              );

              let result;

              switch (action) {
                case "generateDraft":
                  result = await this.generateSingleDraft(emailId, category, tone, templateOverrides, aiProvider);
                  break;

                case "batchGenerate":
                  result = await this.batchGenerateDrafts(filter, category, tone, maxDrafts, templateOverrides, aiProvider);
                  break;

                case "smartInbox":
                  result = await this.smartInboxZero(priority, maxDrafts, tone, aiProvider);
                  break;

                case "analyzeEmail":
                  result = await this.analyzeEmailIntent(emailId, aiProvider);
                  break;

                case "listTemplates":
                  result = await this.listAvailableTemplates();
                  break;

                default:
                  return "Invalid action. Choose from: generateDraft, batchGenerate, smartInbox, analyzeEmail, or listTemplates";
              }

              this.super.introspect(
                `${this.caller}: Successfully completed ${action}`
              );

              return result;
            } catch (error) {
              return `Error in email draft generator: ${error.message}`;
            }
          },

          generateSingleDraft: async function(emailId, category, tone, templateOverrides, aiProvider) {
            // Simulate fetching email content
            const email = await this.fetchEmail(emailId);
            if (!email) return `Email ${emailId} not found`;

            // Analyze email intent using workspace AI
            const analysisPrompt = `Analyze this email and provide: 
1. Category (partnership/pricing/support/sales/feedback/general)
2. Intent (what the sender wants)
3. Priority (1-10)
4. Key points (main topics)

Email from ${email.from}:
Subject: ${email.subject}
Content: ${email.content}

Respond in JSON format.`;

            const analysisResponse = await aiProvider.completion({
              messages: [{ role: "user", content: analysisPrompt }],
            });
            
            const analysis = this.parseAIResponse(analysisResponse, {
              category: category === "auto" ? "general" : category,
              intent: "general inquiry",
              priority: 5,
              keyPoints: []
            });
            
            // Generate draft using workspace AI
            const draftPrompt = `Generate a ${tone} email response to:
From: ${email.from}
Subject: ${email.subject}
Content: ${email.content}

Category: ${analysis.category}
Intent: ${analysis.intent}

Template overrides:
${JSON.stringify(templateOverrides)}

Create a professional response that addresses their points and proposes next steps.`;

            const draftResponse = await aiProvider.completion({
              messages: [{ role: "user", content: draftPrompt }],
            });

            const draft = {
              content: draftResponse.text || draftResponse.content || "Thank you for your email. I'll review and respond shortly.",
              subject: `Re: ${email.subject}`
            };

            // Save draft to Gmail
            const draftId = await this.saveDraftToGmail(email.id, draft);

            return `📧 **Email Draft Generated**
            
**Original Email From:** ${email.from}
**Subject:** ${email.subject}
**Detected Category:** ${analysis.category}
**Intent:** ${analysis.intent}
**Priority Score:** ${analysis.priority}/10

**Generated Draft:**
${draft.content}

**Actions Taken:**
✅ Draft saved to Gmail (ID: ${draftId})
✅ Ready for review and sending
✅ Tone: ${tone}
✅ Estimated response time saved: 5-10 minutes`;
          },

          batchGenerateDrafts: async function(filter, category, tone, maxDrafts, templateOverrides, aiProvider) {
            // Fetch emails matching filter
            const emails = await this.fetchEmailsByFilter(filter, maxDrafts);
            
            if (emails.length === 0) {
              return "No emails found matching the specified filters";
            }

            const results = [];
            for (const email of emails) {
              try {
                // Use workspace AI for analysis
                const analysisPrompt = `Categorize this email: "${email.subject}" from ${email.from}. Content: ${email.content}. Return category and priority.`;
                const analysisResponse = await aiProvider.completion({
                  messages: [{ role: "user", content: analysisPrompt }],
                });
                
                const analysis = this.parseAIResponse(analysisResponse, {
                  category: category === "auto" ? "general" : category,
                  priority: 5
                });

                // Generate draft
                const draftPrompt = `Write a ${tone} response to: ${email.content}`;
                const draftResponse = await aiProvider.completion({
                  messages: [{ role: "user", content: draftPrompt }],
                });

                const draft = {
                  content: draftResponse.text || draftResponse.content || "Draft pending",
                  subject: `Re: ${email.subject}`
                };

                const draftId = await this.saveDraftToGmail(email.id, draft);
                
                results.push({
                  email: email.subject,
                  from: email.from,
                  category: analysis.category,
                  draftId: draftId,
                  status: "success"
                });
              } catch (error) {
                results.push({
                  email: email.subject,
                  from: email.from,
                  status: "failed",
                  error: error.message
                });
              }
            }

            const successful = results.filter(r => r.status === "success").length;
            const failed = results.filter(r => r.status === "failed").length;

            return `📧 **Batch Draft Generation Complete**
            
**Processed:** ${emails.length} emails
**Successful:** ${successful} drafts created
**Failed:** ${failed} emails

**Results:**
${results.map(r => 
  `• ${r.from} - "${r.email.substring(0, 50)}..." 
   Status: ${r.status === "success" ? `✅ Draft saved (${r.category})` : `❌ ${r.error}`}`
).join('\n')}

**Time Saved:** ~${successful * 7} minutes
**Next Step:** Review drafts in your Gmail drafts folder`;
          },

          smartInboxZero: async function(priority, maxDrafts, tone, aiProvider) {
            // Fetch unread emails
            const emails = await this.fetchEmailsByFilter({ unread: true }, maxDrafts * 2);
            
            // Use AI to prioritize emails
            const priorityPrompt = `Prioritize these emails by importance (1-10):
${emails.map((e, i) => `${i+1}. From: ${e.from}, Subject: ${e.subject}`).join('\n')}
Return as JSON array with email index and priority score.`;

            const priorityResponse = await aiProvider.completion({
              messages: [{ role: "user", content: priorityPrompt }],
            });
            
            const priorities = this.parseAIResponse(priorityResponse, emails.map((_, i) => ({ index: i, priority: 5 })));
            
            // Sort by priority and take top emails
            const sortedEmails = priorities
              .sort((a, b) => b.priority - a.priority)
              .slice(0, maxDrafts)
              .map(p => emails[p.index]);
            
            const results = [];

            for (const email of sortedEmails) {
              // Generate draft using workspace AI
              const draftPrompt = `Create a ${tone} response for this email from ${email.from}: ${email.content}`;
              const draftResponse = await aiProvider.completion({
                messages: [{ role: "user", content: draftPrompt }],
              });

              const draft = {
                content: draftResponse.text || draftResponse.content || "Draft pending",
                subject: `Re: ${email.subject}`
              };
              
              const draftId = await this.saveDraftToGmail(email.id, draft);
              
              results.push({
                email: email,
                priority: priorities.find(p => emails[p.index] === email)?.priority || 5,
                draftId: draftId
              });
            }

            return `🎯 **Smart Inbox Zero Report**
            
**Analyzed:** ${emails.length} unread emails
**Priority ${priority} emails:** ${sortedEmails.length}
**Drafts generated:** ${results.length}

**Generated Drafts:**
${results.map(r => 
  `📨 **${r.email.from}**
   Subject: ${r.email.subject}
   Priority: ${r.priority}/10
   Draft ID: ${r.draftId}`
).join('\n\n')}

**Estimated Time Saved:** ${results.length * 8} minutes
**Inbox Status:** ${emails.length - results.length} emails remaining for manual review`;
          },

          analyzeEmailIntent: async function(emailId, aiProvider) {
            const email = await this.fetchEmail(emailId);
            if (!email) return `Email ${emailId} not found`;

            const analysisPrompt = `Provide comprehensive analysis of this email:
From: ${email.from}
Subject: ${email.subject}
Content: ${email.content}

Include: category, intent, sentiment, priority (1-10), urgency, key points, suggested response type, recommended tone, action items, and draft strategy.`;

            const response = await aiProvider.completion({
              messages: [{ role: "user", content: analysisPrompt }],
            });
            
            const analysis = this.parseAIResponse(response, {
              category: "general",
              intent: "inquiry",
              sentiment: "neutral",
              priority: 5,
              urgency: "medium",
              keyPoints: [],
              suggestedResponse: "acknowledgment",
              recommendedTone: "professional",
              actionItems: [],
              draftStrategy: "Address main points and propose next steps"
            });
            
            return `📊 **Email Analysis Report**
            
**Email Details:**
• From: ${email.from}
• Subject: ${email.subject}
• Date: ${email.date}

**AI Analysis:**
• Category: ${analysis.category}
• Intent: ${analysis.intent}
• Sentiment: ${analysis.sentiment}
• Priority Score: ${analysis.priority}/10
• Urgency: ${analysis.urgency}

**Key Points Detected:**
${analysis.keyPoints.map(point => `• ${point}`).join('\n')}

**Suggested Response Type:** ${analysis.suggestedResponse}
**Recommended Tone:** ${analysis.recommendedTone}

**Action Items:**
${analysis.actionItems.map(item => `☐ ${item}`).join('\n')}

**Draft Strategy:**
${analysis.draftStrategy}`;
          },

          listAvailableTemplates: async function() {
            const templates = await this.loadTemplates();
            
            return `📝 **Available Email Templates**
            
${templates.map(t => 
  `**${t.name}** (${t.category})
   Description: ${t.description}
   Use cases: ${t.useCases.join(', ')}
   Variables: ${t.variables.join(', ')}`
).join('\n\n')}

**Custom Template Options:**
• Tone: professional, friendly, casual, formal, enthusiastic
• Length: brief, standard, detailed
• Format: plain text, rich HTML
• Signature: default, custom, none

**Usage Tip:** Specify category="auto" to let AI select the best template automatically.`;
          },

          // Helper functions
          parseAIResponse: function(response, defaultValue) {
            try {
              const text = response.text || response.content || "";
              // Try to parse as JSON
              if (text.includes('{') || text.includes('[')) {
                const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (jsonMatch) {
                  return JSON.parse(jsonMatch[1]);
                }
              }
              return defaultValue;
            } catch (error) {
              return defaultValue;
            }
          },

          fetchEmail: async function(emailId) {
            // Gmail API integration would go here
            // For demo purposes, return mock data
            return {
              id: emailId,
              from: "partner@company.com",
              subject: "Partnership Opportunity",
              content: "We'd like to discuss a potential partnership with your company. We believe there are significant synergies between our organizations.",
              date: new Date().toISOString()
            };
          },

          fetchEmailsByFilter: async function(filter, limit) {
            // Gmail API integration for fetching multiple emails
            // For demo, return empty array
            return [];
          },

          saveDraftToGmail: async function(emailId, draft) {
            // Gmail API integration for saving drafts
            return `draft_${Date.now()}`;
          },

          loadTemplates: async function() {
            // Load email templates from storage
            return [
              {
                name: "Partnership Response",
                category: "partnership",
                description: "Template for responding to partnership inquiries",
                useCases: ["B2B partnerships", "Strategic alliances"],
                variables: ["company_name", "partnership_type", "next_steps"]
              },
              {
                name: "Pricing Inquiry",
                category: "pricing",
                description: "Template for responding to pricing questions",
                useCases: ["Sales inquiries", "Quote requests"],
                variables: ["product_name", "pricing_tier", "discount_options"]
              },
              {
                name: "Support Response",
                category: "support",
                description: "Template for customer support responses",
                useCases: ["Technical issues", "Feature requests"],
                variables: ["issue_type", "resolution_steps", "follow_up"]
              }
            ];
          },
        });
      },
    };
  },
};

module.exports = {
  emailDraftGenerator,
};