const { CollectorApi } = require("../../../collectorApi");
const Provider = require("../providers/ai-provider");
const { summarizeContent } = require("../utils/summarize");

const webScraping = {
  name: "web-scraping",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          controller: new AbortController(),
          description:
            "Scrapes the content of a webpage or online resource from a provided URL.",
          examples: [
            {
              prompt: "What is anythingllm.com about?",
              call: JSON.stringify({ url: "https://anythingllm.com" }),
            },
            {
              prompt: "Scrape https://example.com",
              call: JSON.stringify({ url: "https://example.com" }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              url: {
                type: "string",
                format: "uri",
                description:
                  "A complete web address URL including protocol. Assumes https if not provided.",
              },
            },
            additionalProperties: false,
          },
          handler: async function ({ url }) {
            try {
              if (url) return await this.scrape(url);
              return "There is nothing we can do. This function call returns no information.";
            } catch (error) {
              return `There was an error while calling the function. No data or response was found. Let the user know this was the error: ${error.message}`;
            }
          },

          /**
           * Scrape a website and summarize the content based on objective if the content is too large.
           * Objective is the original objective & task that user give to the agent, url is the url of the website to be scraped.
           * Here we can leverage the document collector to get raw website text quickly.
           *
           * @param url
           * @returns
           */
          scrape: async function (url) {
            this.super.introspect(
              `${this.caller}: Scraping the content of ${url}`
            );

            // Check if collector service is available first
            const collector = new CollectorApi();
            const isOnline = await collector.online();

            if (!isOnline) {
              this.super.introspect(
                `${this.caller}: Collector service is offline. Using fallback method.`
              );
              // Fallback to direct fetch
              try {
                const response = await fetch(url, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (compatible; AnythingLLM-Bot/1.0)",
                  },
                });
                const html = await response.text();
                const content = html
                  .replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
                return content.substring(0, 5000); // Limit content length
              } catch (error) {
                throw new Error(`URL could not be scraped: ${error.message}`);
              }
            }

            const { success, content } = await collector.getLinkContent(url);

            if (!success) {
              this.super.introspect(
                `${this.caller}: could not scrape ${url}. I can't use this page's content.`
              );
              throw new Error(
                `URL could not be scraped and no content was found.`
              );
            }

            if (!content || content?.length === 0) {
              throw new Error("There was no content to be collected or read.");
            }

            const { TokenManager } = require("../../../helpers/tiktoken");
            if (
              new TokenManager(this.super.model).countFromString(content) <
              Provider.contextLimit(this.super.provider, this.super.model)
            ) {
              return content;
            }

            this.super.introspect(
              `${this.caller}: This page's content is way too long. I will summarize it right now.`
            );
            this.super.onAbort(() => {
              this.super.handlerProps.log(
                "Abort was triggered, exiting summarization early."
              );
              this.controller.abort();
            });

            return summarizeContent({
              provider: this.super.provider,
              model: this.super.model,
              controllerSignal: this.controller.signal,
              content,
            });
          },
        });
      },
    };
  },
};

module.exports = {
  webScraping,
};
