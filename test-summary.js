// Test summary API endpoints
const API_BASE = "http://localhost:3001/api";

async function testSummary() {
  try {
    // Test quick summary endpoint
    console.log("Testing quick summary endpoint...");
    const quickResponse = await fetch(`${API_BASE}/workspace/test-workspace/quick-summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.AUTH_TOKEN // You'll need to set this
      }
    });
    
    const quickData = await quickResponse.json();
    console.log("Quick Summary Response:", JSON.stringify(quickData, null, 2));
    
    // Test full summary endpoint
    console.log("\nTesting full summary endpoint...");
    const fullResponse = await fetch(`${API_BASE}/workspace/test-workspace/chat-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.AUTH_TOKEN
      },
      body: JSON.stringify({
        forceRefresh: true
      })
    });
    
    const fullData = await fullResponse.json();
    console.log("Full Summary Response:", JSON.stringify(fullData, null, 2));
    
  } catch (error) {
    console.error("Error testing summary:", error);
  }
}

// You can also test the agent plugin directly
async function testAgentSummary() {
  console.log("\nTesting agent summary plugin...");
  console.log("Send a message starting with '@agent' and ask:");
  console.log("'@agent please generate a summary of our current conversation'");
  console.log("or");
  console.log("'@agent use the generateChatSummary function to summarize our chat'");
}

console.log("Summary API Test Script");
console.log("=======================");
console.log("Note: You need to have a valid auth token and workspace with chat history");
console.log("Update the workspace slug and auth token before running\n");

testSummary();
testAgentSummary();