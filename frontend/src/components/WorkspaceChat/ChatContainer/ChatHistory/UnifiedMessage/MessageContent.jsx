import React from "react";
import renderMarkdown from "@/utils/chat/markdown";
import Citations from "../../Citation";

/**
 * MessageContent Component
 * Renders the actual message content with proper formatting
 * Handles markdown, citations, and structured responses
 */
export default function MessageContent({
  content,
  sources = [],
  workspace = null,
}) {
  // Handle empty content
  if (!content && sources.length === 0) {
    return null;
  }

  // Check if content is structured
  const isStructured = typeof content === "object" && content !== null;

  return (
    <div className="message-content">
      {/* Main Content */}
      {isStructured ? (
        <StructuredContent data={content} />
      ) : (
        <div
          className="prose-ultra-elegant content-flow-ultra-elegant glass-morphism-ultra-elegant message-ultra-elegant-entrance"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(content || ""),
          }}
        />
      )}

      {/* Citations */}
      {sources && sources.length > 0 && (
        <div className="mt-4">
          <Citations sources={sources} />
        </div>
      )}
    </div>
  );
}

/**
 * Structured Content Renderer
 * Handles special structured message formats
 */
function StructuredContent({ data }) {
  // Handle different structured formats
  if (data.type === "schedule") {
    return <ScheduleDisplay data={data} />;
  }

  if (data.type === "email") {
    return <EmailDisplay data={data} />;
  }

  if (data.type === "task") {
    return <TaskDisplay data={data} />;
  }

  if (data.type === "workflow") {
    return <WorkflowDisplay data={data} />;
  }

  // Default structured display
  return <DefaultStructured data={data} />;
}

/**
 * Schedule Display Component
 */
function ScheduleDisplay({ data }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {data.title || "Schedule"}
        </h4>
        {data.subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {data.subtitle}
          </p>
        )}
      </div>

      {data.items && (
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">
                {item.time}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </div>
                {item.subtitle && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.subtitle}
                  </div>
                )}
              </div>
              {item.tag && (
                <span
                  className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${item.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : ""}
                  ${item.color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : ""}
                  ${item.color === "purple" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : ""}
                  ${item.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : ""}
                  ${!item.color ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" : ""}
                `}
                >
                  {item.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Email Display Component
 */
function EmailDisplay({ data }) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-2 mb-3">
        <svg
          className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {data.title || "Email Sent"}
        </h4>
      </div>

      <div className="space-y-2 text-sm">
        {data.to && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              To:
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">
              {data.to}
            </span>
          </div>
        )}
        {data.subject && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              Subject:
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">
              {data.subject}
            </span>
          </div>
        )}
        {data.attachments && data.attachments.length > 0 && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              Attachments:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {data.attachments.map((file, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs"
                >
                  📎 {file.name || file}
                  {file.size && (
                    <span className="text-gray-500 dark:text-gray-400">
                      ({file.size})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.footer && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          {data.footer}
        </p>
      )}
    </div>
  );
}

/**
 * Task Display Component
 */
function TaskDisplay({ data }) {
  return (
    <div className="space-y-3">
      {data.title && (
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {data.title}
        </h4>
      )}

      {data.cards &&
        data.cards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              {card.icon && <span className="text-2xl">{card.icon}</span>}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                    {card.title}
                  </h5>
                  {card.id && (
                    <span className="px-2 py-0.5 text-xs font-mono bg-gray-900 dark:bg-gray-700 text-white rounded">
                      {card.id}
                    </span>
                  )}
                </div>

                {card.items && (
                  <div className="space-y-1">
                    {card.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.label}:
                        </span>
                        <span
                          className={`
                        font-medium
                        ${item.color === "red" ? "text-red-600 dark:text-red-400" : ""}
                        ${item.color === "green" ? "text-green-600 dark:text-green-400" : ""}
                        ${item.color === "blue" ? "text-blue-600 dark:text-blue-400" : ""}
                        ${!item.color ? "text-gray-900 dark:text-gray-100" : ""}
                      `}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {data.footer && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {data.footer}
        </div>
      )}
    </div>
  );
}

/**
 * Workflow Display Component
 */
function WorkflowDisplay({ data }) {
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {data.title || "Workflow Created"}
        </h4>
      </div>

      {data.steps && (
        <div className="space-y-2">
          {data.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {step}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {data.description}
        </p>
      )}
    </div>
  );
}

/**
 * Default Structured Display
 */
function DefaultStructured({ data }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      {data.title && (
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {data.title}
        </h4>
      )}
      {data.content && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(data.content),
          }}
        />
      )}
      {data.sections &&
        data.sections.map((section, index) => (
          <div key={index} className="mt-3">
            {section.label && (
              <div className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1">
                {section.label}
              </div>
            )}
            <div className="text-gray-900 dark:text-gray-100">
              {section.value}
            </div>
          </div>
        ))}
    </div>
  );
}
