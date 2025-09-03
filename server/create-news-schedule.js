#!/usr/bin/env node

/**
 * Script to create a scheduled agent task for Daily Tech News
 * This will run every 2 minutes for testing purposes
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Set default STORAGE_DIR if not set
if (!process.env.STORAGE_DIR) {
  process.env.STORAGE_DIR = path.resolve(__dirname, "storage");
}

const { AgentSchedule } = require("./models/agentSchedule");
const { Workspace } = require("./models/workspace");

async function createNewsSchedule() {
  try {
    console.log("Creating Daily Tech News schedule...");

    // Get the workspace (using 'segev' workspace)
    const workspace = await Workspace.get({ slug: "segev" });
    if (!workspace) {
      throw new Error("Workspace 'segev' not found. Please create it first.");
    }
    console.log(`Using workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Schedule configuration
    const scheduleConfig = {
      agentId: "tech-news-agent", // Custom agent ID for this task
      agentType: "custom", // Custom agent type
      name: "Daily Tech News Digest",
      description: "Fetches and summarizes top tech news from HackerNews and TechCrunch every 2 minutes",
      workspaceId: workspace.id,
      cronExpression: "*/2 * * * *", // Every 2 minutes for testing
      timezone: "America/Los_Angeles", // Pacific timezone
      context: JSON.stringify({
        prompt: "Summarize the top 5 tech news stories from HackerNews and TechCrunch. Format as bullet points with title and brief description.",
        sources: ["https://news.ycombinator.com", "https://techcrunch.com"],
        format: "bullet points",
        maxItems: 5,
        workflow: [
          "1. Fetch content from HackerNews front page",
          "2. Fetch content from TechCrunch latest articles",
          "3. Analyze and filter for tech-related news",
          "4. Rank by relevance and recency",
          "5. Generate concise summary for top 5 stories",
          "6. Format as bullet points with source links"
        ]
      }),
      enabled: true,
      createdBy: null, // System-created
    };

    // Check if schedule already exists (by workspace and similar name)
    const existingSchedules = await AgentSchedule.where({
      workspaceId: workspace.id
    });
    
    const existingSchedule = existingSchedules.find(s => 
      s.name === scheduleConfig.name || s.name.includes("Tech News")
    );

    if (existingSchedule) {
      console.log("Schedule already exists. Updating...");
      const { schedule, error } = await AgentSchedule.update(
        existingSchedule.id,
        scheduleConfig
      );
      
      if (error) {
        throw new Error(error);
      }
      
      console.log("✅ Schedule updated successfully!");
      console.log("Schedule details:");
      console.log(`- ID: ${schedule.id}`);
      console.log(`- Name: ${schedule.name}`);
      console.log(`- Cron: ${schedule.cron_expression} (Every 2 minutes)`);
      console.log(`- Timezone: ${schedule.timezone}`);
      console.log(`- Enabled: ${schedule.enabled}`);
    } else {
      // Create new schedule
      const { schedule, error } = await AgentSchedule.create(scheduleConfig);
      
      if (error) {
        throw new Error(error);
      }
      
      console.log("✅ Schedule created successfully!");
      console.log("\nSchedule details:");
      console.log(`- ID: ${schedule.id}`);
      console.log(`- Name: ${schedule.name}`);
      console.log(`- Cron: ${schedule.cron_expression} (Every 2 minutes)`);
      console.log(`- Timezone: ${schedule.timezone}`);
      console.log(`- Enabled: ${schedule.enabled}`);
      console.log("\n📋 Context:");
      console.log(JSON.parse(schedule.context));
    }

    console.log("\n🚀 The agent will now run every 2 minutes to fetch and summarize tech news!");
    console.log("Check the workspace chat history to see the summaries.");
    console.log("\nTo change to daily at 9 AM, update cron expression to: '0 9 * * *'");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating schedule:", error.message);
    process.exit(1);
  }
}

// Run the script
createNewsSchedule();