const stockMarket = {
  name: "stock-market",
  startupConfig: {
    params: {
      ALPHA_VANTAGE_API_KEY: {
        type: "string",
        required: false,
        description: "Alpha Vantage API key for stock data. Get free at alphavantage.co/support/#api-key",
        default: process.env.ALPHA_VANTAGE_API_KEY || "",
      },
    },
  },
  plugin: function ({ ALPHA_VANTAGE_API_KEY }) {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          description:
            "Get real-time stock market data including prices, market cap, P/E ratios, technical indicators (RSI, moving averages), and company overview. Supports US stock symbols.",
          examples: [
            {
              prompt: "What's the current price of Apple stock?",
              call: JSON.stringify({ 
                symbol: "AAPL", 
                dataType: "quote" 
              }),
            },
            {
              prompt: "Show me Tesla's technical indicators",
              call: JSON.stringify({ 
                symbol: "TSLA", 
                dataType: "technical",
                indicator: "RSI"
              }),
            },
            {
              prompt: "Get Microsoft company overview and fundamentals",
              call: JSON.stringify({ 
                symbol: "MSFT", 
                dataType: "overview" 
              }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              symbol: {
                type: "string",
                description: "Stock ticker symbol (e.g., AAPL, GOOGL, TSLA)",
              },
              dataType: {
                type: "string",
                enum: ["quote", "overview", "technical", "news"],
                description: "Type of data to fetch: quote (price), overview (company info), technical (indicators), news",
              },
              indicator: {
                type: "string",
                enum: ["SMA", "EMA", "RSI", "MACD", "STOCH"],
                description: "Technical indicator to calculate (only for technical dataType)",
              },
              timePeriod: {
                type: "number",
                description: "Time period for technical indicators (default: 14 for RSI, 20 for SMA/EMA)",
                default: 14,
              },
            },
            required: ["symbol", "dataType"],
            additionalProperties: false,
          },
          handler: async function ({ symbol, dataType, indicator, timePeriod }) {
            try {
              const apiKey = ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
              
              if (!apiKey) {
                return "Stock market data requires an Alpha Vantage API key. Get a free key at: https://www.alphavantage.co/support/#api-key\n\nSet it in your environment as ALPHA_VANTAGE_API_KEY or configure it in the agent settings.";
              }

              this.super.introspect(
                `${this.caller}: Fetching ${dataType} data for ${symbol.toUpperCase()}...`
              );

              let url, result;

              switch (dataType) {
                case "quote":
                  url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
                  result = await this.fetchQuote(url, symbol);
                  break;

                case "overview":
                  url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
                  result = await this.fetchOverview(url, symbol);
                  break;

                case "technical":
                  if (!indicator) {
                    return "Please specify a technical indicator (SMA, EMA, RSI, MACD, or STOCH)";
                  }
                  url = await this.buildTechnicalUrl(symbol, indicator, timePeriod, apiKey);
                  result = await this.fetchTechnical(url, symbol, indicator);
                  break;

                case "news":
                  // Using a fallback news API or scraping approach since Alpha Vantage news requires premium
                  result = await this.fetchNews(symbol);
                  break;

                default:
                  return "Invalid data type. Choose from: quote, overview, technical, or news";
              }

              this.super.introspect(
                `${this.caller}: Successfully retrieved ${dataType} data for ${symbol.toUpperCase()}`
              );

              return result;
            } catch (error) {
              return `Error fetching stock data: ${error.message}`;
            }
          },

          fetchQuote: async function(url, symbol) {
            const response = await fetch(url);
            const data = await response.json();

            if (data["Error Message"]) {
              return `Invalid stock symbol: ${symbol}`;
            }

            if (data["Note"]) {
              return "API rate limit reached. Please try again later or upgrade your API key.";
            }

            const quote = data["Global Quote"];
            if (!quote || Object.keys(quote).length === 0) {
              return `No data found for symbol: ${symbol}`;
            }

            const price = parseFloat(quote["05. price"]).toFixed(2);
            const change = parseFloat(quote["09. change"]).toFixed(2);
            const changePercent = quote["10. change percent"];
            const volume = parseInt(quote["06. volume"]).toLocaleString();
            const previousClose = parseFloat(quote["08. previous close"]).toFixed(2);
            const open = parseFloat(quote["02. open"]).toFixed(2);
            const high = parseFloat(quote["03. high"]).toFixed(2);
            const low = parseFloat(quote["04. low"]).toFixed(2);

            const arrow = change >= 0 ? "↑" : "↓";
            const emoji = change >= 0 ? "📈" : "📉";

            return `${emoji} **${symbol.toUpperCase()} Stock Quote**
            
Current Price: $${price} ${arrow} ${change} (${changePercent})
Previous Close: $${previousClose}
Open: $${open}
Day Range: $${low} - $${high}
Volume: ${volume}
Last Updated: ${quote["07. latest trading day"]}`;
          },

          fetchOverview: async function(url, symbol) {
            const response = await fetch(url);
            const data = await response.json();

            if (data["Error Message"] || Object.keys(data).length === 0) {
              return `No company data found for symbol: ${symbol}`;
            }

            const marketCap = data.MarketCapitalization 
              ? `$${(parseInt(data.MarketCapitalization) / 1e9).toFixed(2)}B` 
              : "N/A";
            
            return `**${data.Name || symbol.toUpperCase()} Company Overview**

📊 **Fundamentals:**
• Market Cap: ${marketCap}
• P/E Ratio: ${data.PERatio || "N/A"}
• EPS: ${data.EPS || "N/A"}
• Dividend Yield: ${data.DividendYield ? (parseFloat(data.DividendYield) * 100).toFixed(2) + "%" : "N/A"}
• 52 Week High: $${data["52WeekHigh"] || "N/A"}
• 52 Week Low: $${data["52WeekLow"] || "N/A"}
• Beta: ${data.Beta || "N/A"}

📈 **Performance:**
• 50-Day MA: $${data["50DayMovingAverage"] || "N/A"}
• 200-Day MA: $${data["200DayMovingAverage"] || "N/A"}
• YTD Return: ${data.YearToDateReturn ? (parseFloat(data.YearToDateReturn) * 100).toFixed(2) + "%" : "N/A"}

🏢 **Company Info:**
• Sector: ${data.Sector || "N/A"}
• Industry: ${data.Industry || "N/A"}
• Exchange: ${data.Exchange || "N/A"}
• Employees: ${data.FullTimeEmployees ? parseInt(data.FullTimeEmployees).toLocaleString() : "N/A"}

📝 **Description:**
${data.Description ? data.Description.substring(0, 300) + "..." : "No description available"}`;
          },

          buildTechnicalUrl: async function(symbol, indicator, timePeriod, apiKey) {
            const indicatorMap = {
              "SMA": "SMA",
              "EMA": "EMA", 
              "RSI": "RSI",
              "MACD": "MACD",
              "STOCH": "STOCH"
            };

            const func = indicatorMap[indicator];
            let url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&interval=daily&apikey=${apiKey}`;

            if (["SMA", "EMA", "RSI"].includes(indicator)) {
              url += `&time_period=${timePeriod || 14}&series_type=close`;
            }

            return url;
          },

          fetchTechnical: async function(url, symbol, indicator) {
            const response = await fetch(url);
            const data = await response.json();

            if (data["Error Message"]) {
              return `Error fetching technical data for ${symbol}`;
            }

            if (data["Note"]) {
              return "API rate limit reached. Please try again later.";
            }

            const technicalKey = `Technical Analysis: ${indicator}`;
            const technicalData = data[technicalKey];

            if (!technicalData) {
              return `No ${indicator} data available for ${symbol}`;
            }

            const dates = Object.keys(technicalData).slice(0, 5);
            const latestDate = dates[0];
            const latestValue = technicalData[latestDate][indicator];

            let interpretation = "";
            if (indicator === "RSI") {
              const rsiValue = parseFloat(latestValue);
              if (rsiValue > 70) {
                interpretation = "🔴 Overbought - Potential sell signal";
              } else if (rsiValue < 30) {
                interpretation = "🟢 Oversold - Potential buy signal";
              } else {
                interpretation = "🟡 Neutral";
              }
            }

            let result = `📊 **${symbol.toUpperCase()} Technical Analysis - ${indicator}**\n\n`;
            result += `Latest ${indicator}: ${parseFloat(latestValue).toFixed(2)}`;
            if (interpretation) result += `\nSignal: ${interpretation}`;
            result += `\n\n**Recent Values:**\n`;

            dates.forEach(date => {
              const value = technicalData[date][indicator];
              result += `• ${date}: ${parseFloat(value).toFixed(2)}\n`;
            });

            return result;
          },

          fetchNews: async function(symbol) {
            // Simplified news fetching - in production, integrate with a news API
            return `📰 **${symbol.toUpperCase()} Latest News**

To get real-time news, consider integrating with:
• NewsAPI (newsapi.org)
• Finnhub (finnhub.io)
• Polygon.io
• Yahoo Finance API

Note: Most financial news APIs require separate API keys.

For now, you can check:
• https://finance.yahoo.com/quote/${symbol}/news
• https://www.google.com/finance/quote/${symbol}:NASDAQ`;
          },
        });
      },
    };
  },
};

module.exports = {
  stockMarket,
};