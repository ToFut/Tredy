#!/usr/bin/env node

/**
 * Test script to demonstrate the @flow command capabilities
 * This simulates what happens when you use @flow in the AnythingLLM interface
 */

const testFlowCommand = `
@flow Meeting, Email, Data, Summary, News workflow: 

1. Send email to segev@sinosciences.com with subject: "Meeting Tomorrow"  
   Body: "Hi Segev, just confirming we have a meeting scheduled for tomorrow. Talk soon."

2. Create a calendar invite for tomorrow at 3:00 PM ET  
   Title: "Project Meeting with Segev"  
   Invitee: segev@sinosciences.com  
   Description: "Discussion on current project progress and next steps."

3. Check my email inbox.

4. Search inbox for recent messages containing "raw data" or related attachments.

5. Extract or download raw data files found in emails.

6. Compose email to segev@futurixs.com  
   Subject: "Raw Data Files"  
   Body: "Hi Segev, please find attached the latest raw data as requested."  
   Attach the raw data files.

7. Summarize the contents of the recent emails in my inbox (last 24–48 hours).

8. Send email to segev@sinosciences.com  
   Subject: "Email Summary"  
   Body: Include the summarized email contents.

9. Check latest news (general + relevant to our industry).

10. Select 3–5 notable or interesting news headlines or summaries.

11. Compose email with subject: "Latest News Highlights"  
    Body: Include brief summaries or links to the selected news stories.

12. Send the news email to segevhalfon1@gmail.com  
    CC: segev@futurixs.com

13. Confirm all emails were successfully sent.

14. Confirm calendar invite was accepted or at least delivered.

15. Log or report any errors encountered in data retrieval or email summary.

16. Mark this flow as complete in task tracker.

17. Archive raw data emails after sending.

18. Label or categorize summarized emails for future reference.

19. Store news sources for next round (optional).

20. Notify me when all steps are completed.
`;

console.log("🧪 Testing @flow Command Capabilities");
console.log("=====================================");
console.log();
console.log("📝 Flow Command:");
console.log(testFlowCommand);
console.log();

// Simulate what the workflow system would do
console.log("🔧 Workflow System Analysis:");
console.log("============================");
console.log();

const workflowSteps = [
  {
    step: 1,
    action: "Send Email",
    tool: "gmail-send_email",
    parameters: {
      to: "segev@sinosciences.com",
      subject: "Meeting Tomorrow",
      body: "Hi Segev, just confirming we have a meeting scheduled for tomorrow. Talk soon."
    }
  },
  {
    step: 2,
    action: "Create Calendar Event",
    tool: "gcalendar-create_event",
    parameters: {
      title: "Project Meeting with Segev",
      attendees: ["segev@sinosciences.com"],
      startTime: "tomorrow 3:00 PM ET",
      description: "Discussion on current project progress and next steps."
    }
  },
  {
    step: 3,
    action: "Check Email Inbox",
    tool: "gmail-get_emails",
    parameters: {
      maxResults: 50,
      query: "in:inbox"
    }
  },
  {
    step: 4,
    action: "Search for Raw Data Emails",
    tool: "gmail-get_emails",
    parameters: {
      query: "raw data OR attachment:csv OR attachment:xlsx OR attachment:json"
    }
  },
  {
    step: 5,
    action: "Extract Data Files",
    tool: "gmail-get_attachments",
    parameters: {
      messageId: "{{from_step_4}}",
      downloadPath: "/tmp/extracted_data"
    }
  },
  {
    step: 6,
    action: "Send Data Email",
    tool: "gmail-send_email",
    parameters: {
      to: "segev@futurixs.com",
      subject: "Raw Data Files",
      body: "Hi Segev, please find attached the latest raw data as requested.",
      attachments: "{{from_step_5}}"
    }
  },
  {
    step: 7,
    action: "Summarize Recent Emails",
    tool: "llm-instruction",
    parameters: {
      instruction: "Summarize the contents of emails from the last 24-48 hours",
      inputData: "{{from_step_3}}"
    }
  },
  {
    step: 8,
    action: "Send Email Summary",
    tool: "gmail-send_email",
    parameters: {
      to: "segev@sinosciences.com",
      subject: "Email Summary",
      body: "{{from_step_7}}"
    }
  },
  {
    step: 9,
    action: "Check Latest News",
    tool: "web-scraping",
    parameters: {
      url: "https://news.google.com",
      resultVariable: "news_data"
    }
  },
  {
    step: 10,
    action: "Select News Highlights",
    tool: "llm-instruction",
    parameters: {
      instruction: "Select 3-5 notable news headlines relevant to our industry",
      inputData: "{{news_data}}"
    }
  },
  {
    step: 11,
    action: "Compose News Email",
    tool: "llm-instruction",
    parameters: {
      instruction: "Create email content with news highlights",
      inputData: "{{from_step_10}}"
    }
  },
  {
    step: 12,
    action: "Send News Email",
    tool: "gmail-send_email",
    parameters: {
      to: "segevhalfon1@gmail.com",
      cc: "segev@futurixs.com",
      subject: "Latest News Highlights",
      body: "{{from_step_11}}"
    }
  },
  {
    step: 13,
    action: "Confirm Email Delivery",
    tool: "gmail-get_emails",
    parameters: {
      query: "from:me subject:\"Meeting Tomorrow\" OR subject:\"Raw Data Files\" OR subject:\"Email Summary\" OR subject:\"Latest News Highlights\""
    }
  },
  {
    step: 14,
    action: "Confirm Calendar Delivery",
    tool: "gcalendar-get_events",
    parameters: {
      query: "Project Meeting with Segev"
    }
  },
  {
    step: 15,
    action: "Log Errors",
    tool: "api-call",
    parameters: {
      url: "http://localhost:3001/api/logs",
      method: "POST",
      body: "{{error_logs}}"
    }
  },
  {
    step: 16,
    action: "Mark Flow Complete",
    tool: "api-call",
    parameters: {
      url: "http://localhost:3001/api/workflows/complete",
      method: "POST",
      body: JSON.stringify({ workflowId: "{{workflow_uuid}}", status: "completed" })
    }
  },
  {
    step: 17,
    action: "Archive Raw Data Emails",
    tool: "gmail-modify_message",
    parameters: {
      messageId: "{{from_step_4}}",
      action: "archive"
    }
  },
  {
    step: 18,
    action: "Label Summarized Emails",
    tool: "gmail-modify_message",
    parameters: {
      messageId: "{{from_step_3}}",
      action: "add_label",
      labelId: "summarized"
    }
  },
  {
    step: 19,
    action: "Store News Sources",
    tool: "api-call",
    parameters: {
      url: "http://localhost:3001/api/news-sources",
      method: "POST",
      body: JSON.stringify({ sources: "{{news_data}}" })
    }
  },
  {
    step: 20,
    action: "Send Completion Notification",
    tool: "gmail-send_email",
    parameters: {
      to: "segev@sinosciences.com",
      subject: "Workflow Complete",
      body: "All workflow steps have been completed successfully!"
    }
  }
];

console.log("📋 Generated Workflow Steps:");
console.log("===========================");
workflowSteps.forEach(step => {
  console.log(`Step ${step.step}: ${step.action}`);
  console.log(`  Tool: ${step.tool}`);
  console.log(`  Parameters: ${JSON.stringify(step.parameters, null, 2)}`);
  console.log();
});

console.log("🔍 Available MCP Tools Analysis:");
console.log("=================================");
console.log();

const availableTools = [
  "gmail-send_email",
  "gmail-get_emails", 
  "gmail-get_attachments",
  "gmail-modify_message",
  "gcalendar-create_event",
  "gcalendar-get_events",
  "web-scraping",
  "llm-instruction",
  "api-call"
];

availableTools.forEach(tool => {
  console.log(`✅ ${tool} - Available`);
});

console.log();
console.log("🎯 Workflow Capabilities Summary:");
console.log("================================");
console.log("✅ Email Operations: Send, receive, search, manage emails");
console.log("✅ Calendar Operations: Create events, check availability");
console.log("✅ Data Processing: Extract attachments, process files");
console.log("✅ Content Generation: Summarize emails, create reports");
console.log("✅ Web Scraping: Get latest news and information");
console.log("✅ Task Management: Track progress, log errors");
console.log("✅ File Management: Download, attach, archive files");
console.log("✅ Notification System: Send completion alerts");
console.log();

console.log("🚀 This workflow demonstrates the full capabilities of the @flow command!");
console.log("   The system can handle complex multi-step processes with:");
console.log("   - Email automation");
console.log("   - Calendar management");
console.log("   - Data processing");
console.log("   - Content generation");
console.log("   - Task tracking");
console.log("   - Error handling");
console.log("   - Notification systems");