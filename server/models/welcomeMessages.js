const prisma = require("../utils/prisma");

// Tredy default welcome messages
const TREDY_DEFAULT_MESSAGES = [
  {
    user: "How do I get started?",
    response: "Welcome to Tredy! 🚀\n\nGood morning! I'm your AI-powered business assistant. I can connect to any app, answer any question, and execute any task for you.\n\nLet's start with something powerful - I can manage your entire social media presence! I'll:\n• Learn about your business\n• Create engaging images, videos, and text content\n• Schedule posts automatically for the next 5 days\n\nWant to try? Let's connect your social accounts!"
  },
  {
    user: "Yes, let's do it!",
    response: "Perfect! Let's connect your social media accounts:\n\n📘 **Facebook** - [Connect Account]\n📸 **Instagram** - [Connect Account]\n🔗 **LinkedIn** - [Connect Account]\n✅ **Google** - ✨ Already connected (Welcome back!)\n\nI see you've already connected Google - great! Once you connect the others, I'll analyze your business and create custom content tailored to your brand."
  },
  {
    user: "I've connected my accounts",
    response: "🎯 **Analyzing your business...**\n\n✅ Brand voice identified\n✅ Target audience analyzed\n✅ Content themes generated\n✅ Optimal posting times calculated\n\n**Great news!** I've created 10 beautiful posts for you to publish this week across LinkedIn, Instagram, and Facebook!\n\n📅 **This Week's Content Calendar:**\n\n**Monday 9:00 AM** - LinkedIn: Thought leadership article\n**Monday 6:00 PM** - Instagram: Behind-the-scenes reel\n\n**Tuesday 12:00 PM** - Facebook: Customer success story\n**Tuesday 5:00 PM** - Instagram: Product showcase\n\n**Wednesday 10:00 AM** - LinkedIn: Team spotlight\n**Wednesday 7:00 PM** - Instagram Stories: Q&A session\n\n**Thursday 11:00 AM** - Facebook: Educational infographic\n**Thursday 4:00 PM** - LinkedIn: Industry insights\n\n**Friday 9:00 AM** - Instagram: Weekend engagement reel\n**Friday 2:00 PM** - Facebook: Week recap\n\nWould you like to preview the content or shall I schedule everything?"
  },
  {
    user: "What else can you do?",
    response: "I'm your complete AI business assistant! Here's what I can do:\n\n🤖 **Automation & Integration**\n• Connect to 1000+ apps (Slack, Gmail, Salesforce, Shopify, etc.)\n• Automate repetitive tasks and workflows\n• Sync data across all your platforms\n\n📊 **Analytics & Insights**\n• Real-time business performance dashboards\n• Competitor analysis and market trends\n• Customer sentiment analysis\n\n✍️ **Content Creation**\n• Generate blog posts, emails, and social media content\n• Create professional graphics and videos\n• Develop marketing campaigns\n\n🎯 **Task Execution**\n• Schedule meetings and manage calendars\n• Send personalized email campaigns\n• Process documents and extract data\n• Answer customer inquiries\n\n💡 **AI-Powered Assistance**\n• Strategic business recommendations\n• 24/7 intelligent support\n• Learn and adapt to your business needs\n\nJust tell me what you need, and I'll handle it!"
  },
  {
    user: "How do I train you on my business?",
    response: "Training me is super easy! I learn from multiple sources:\n\n📁 **Upload Your Documents**\n• Drop any files here - PDFs, docs, spreadsheets, presentations\n• I'll analyze your brand guidelines, SOPs, product info, and more\n• The more you share, the smarter I become about your business\n\n🔗 **Connect Your Tools**\n• Link your CRM, email, social media, and other platforms\n• I'll learn from your historical data and patterns\n• Real-time learning from ongoing activities\n\n💬 **Just Chat With Me**\n• Tell me about your business goals and challenges\n• Correct me when needed - I learn from feedback\n• Ask questions - every interaction makes me better\n\n🎯 **Workspace Organization**\n• Create different workspaces for different projects or departments\n• Each workspace can have its own training data and personality\n• Switch between focused expertise areas instantly\n\nWant to start by uploading some documents or connecting a specific tool?"
  }
];

const WelcomeMessages = {
  get: async function (clause = {}) {
    try {
      const message = await prisma.welcome_messages.findFirst({
        where: clause,
      });
      return message || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  where: async function (clause = {}, limit) {
    try {
      const messages = await prisma.welcome_messages.findMany({
        where: clause,
        take: limit || undefined,
      });
      return messages;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  saveAll: async function (messages) {
    try {
      await prisma.welcome_messages.deleteMany({}); // Delete all existing messages

      // Create new messages
      // We create each message individually because prisma
      // with sqlite does not support createMany()
      for (const [index, message] of messages.entries()) {
        if (!message.response && !message.user) continue;
        await prisma.welcome_messages.create({
          data: {
            user: message.user,
            response: message.response,
            orderIndex: index,
          },
        });
      }
    } catch (error) {
      console.error("Failed to save all messages", error.message);
    }
  },

  getMessages: async function () {
    try {
      const messages = await prisma.welcome_messages.findMany({
        orderBy: { orderIndex: "asc" },
        select: { user: true, response: true },
      });
      
      // If no messages exist, return Tredy defaults
      if (!messages || messages.length === 0) {
        return TREDY_DEFAULT_MESSAGES;
      }
      
      return messages;
    } catch (error) {
      console.error("Failed to get all messages", error.message);
      // Return Tredy defaults on error
      return TREDY_DEFAULT_MESSAGES;
    }
  },

  // Method to initialize default messages
  initializeDefaults: async function () {
    try {
      const existingMessages = await prisma.welcome_messages.count();
      if (existingMessages === 0) {
        console.log("No welcome messages found, initializing Tredy defaults...");
        await this.saveAll(TREDY_DEFAULT_MESSAGES);
        console.log("Tredy default welcome messages initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize default messages", error.message);
    }
  },
};

module.exports.WelcomeMessages = WelcomeMessages;
