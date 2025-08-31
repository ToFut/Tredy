import EditingChatBubble from "@/components/EditingChatBubble";
import System from "@/models/system";
import showToast from "@/utils/toast";
import { Plus } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

export default function CustomMessages() {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function fetchMessages() {
      const messages = await System.getWelcomeMessages();
      // If no messages exist, use Tredy defaults
      setMessages(messages && messages.length > 0 ? messages : TREDY_DEFAULT_MESSAGES);
    }
    fetchMessages();
  }, []);

  const addMessage = (type) => {
    if (type === "user") {
      setMessages([
        ...messages,
        {
          user: t("customization.items.welcome-messages.double-click"),
          response: "",
        },
      ]);
    } else {
      setMessages([
        ...messages,
        {
          user: "",
          response: t("customization.items.welcome-messages.double-click"),
        },
      ]);
    }
  };

  const removeMessage = (index) => {
    setHasChanges(true);
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index, type, value) => {
    setHasChanges(true);
    const newMessages = [...messages];
    newMessages[index][type] = value;
    setMessages(newMessages);
  };

  const handleMessageSave = async () => {
    const { success, error } = await System.setWelcomeMessages(messages);
    if (!success) {
      showToast(`Failed to update welcome messages: ${error}`, "error");
      return;
    }
    showToast("Successfully updated welcome messages.", "success");
    setHasChanges(false);
  };

  return (
    <div className="flex flex-col gap-y-0.5 my-4">
      <p className="text-sm leading-6 font-semibold text-white">
        {t("customization.items.welcome-messages.title")}
      </p>
      <p className="text-xs text-white/60">
        {t("customization.items.welcome-messages.description")}
      </p>
      <div className="mt-2 flex flex-col gap-y-6 bg-theme-settings-input-bg rounded-lg pr-[31px] pl-[12px] pt-4 max-w-[700px]">
        {messages.map((message, index) => (
          <div key={index} className="flex flex-col gap-y-2">
            {message.user && (
              <EditingChatBubble
                message={message}
                index={index}
                type="user"
                handleMessageChange={handleMessageChange}
                removeMessage={removeMessage}
              />
            )}
            {message.response && (
              <EditingChatBubble
                message={message}
                index={index}
                type="response"
                handleMessageChange={handleMessageChange}
                removeMessage={removeMessage}
              />
            )}
          </div>
        ))}
        <div className="flex gap-4 mt-12 justify-between pb-[15px]">
          <button
            className="border-none self-end text-white hover:text-white/60 light:hover:text-black/60 transition"
            onClick={() => addMessage("response")}
          >
            <div className="flex items-center justify-start text-sm font-normal -ml-2">
              <Plus className="m-2" size={16} weight="bold" />
              <span className="leading-5">
                {t("customization.items.welcome-messages.new")}{" "}
                <span className="font-bold italic mr-1">
                  {t("customization.items.welcome-messages.system")}
                </span>{" "}
                {t("customization.items.welcome-messages.message")}
              </span>
            </div>
          </button>
          <button
            className="border-none self-end text-white hover:text-white/60 light:hover:text-black/60 transition"
            onClick={() => addMessage("user")}
          >
            <div className="flex items-center justify-start text-sm font-normal">
              <Plus className="m-2" size={16} weight="bold" />
              <span className="leading-5">
                {t("customization.items.welcome-messages.new")}{" "}
                <span className="font-bold italic mr-1">
                  {t("customization.items.welcome-messages.user")}
                </span>{" "}
                {t("customization.items.welcome-messages.message")}
              </span>
            </div>
          </button>
        </div>
      </div>
      <div className="flex justify-start gap-2 pt-2">
        {hasChanges && (
          <button
            className="transition-all duration-300 border border-slate-200 px-4 py-2 rounded-lg text-white text-sm items-center flex gap-x-2 hover:bg-slate-200 hover:text-slate-800 focus:ring-gray-800"
            onClick={handleMessageSave}
          >
            {t("customization.items.welcome-messages.save")}
          </button>
        )}
        <button
          className="transition-all duration-300 border border-purple-500 px-4 py-2 rounded-lg text-purple-500 text-sm items-center flex gap-x-2 hover:bg-purple-500 hover:text-white"
          onClick={() => {
            setMessages(TREDY_DEFAULT_MESSAGES);
            setHasChanges(true);
          }}
        >
          Reset to Tredy Defaults
        </button>
      </div>
    </div>
  );
}
