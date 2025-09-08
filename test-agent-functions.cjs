const { agentSkillsFromSystemSettings, WORKSPACE_AGENT } = require("./server/utils/agents/defaults.js");
const MCPCompatibilityLayer = require("./server/utils/MCP");
const ImportedPlugin = require("./server/utils/agents/imported");
const { AgentFlows } = require("./server/utils/agentFlows");

async function testAgentFunctions() {
  console.log("🔍 Testing Agent Function Loading...\n");
  
  // Test built-in skills loading
  console.log("1. Testing agentSkillsFromSystemSettings()...");
  try {
    const skills = await agentSkillsFromSystemSettings();
    console.log("✅ Built-in skills loaded:", skills.length);
    skills.forEach(skill => console.log(`   - ${skill}`));
  } catch (error) {
    console.error("❌ Error loading built-in skills:", error.message);
  }
  
  console.log("\n2. Testing MCP servers...");
  try {
    const mcpLayer = new MCPCompatibilityLayer();
    const mcpServers = await mcpLayer.activeMCPServers("test-workspace");
    console.log(`✅ MCP servers loaded: ${mcpServers.length}`);
    mcpServers.forEach(server => console.log(`   - ${server.name || 'Unnamed'}`));
  } catch (error) {
    console.error("❌ Error loading MCP servers:", error.message);
  }
  
  console.log("\n3. Testing imported plugins...");
  try {
    const importedPlugins = ImportedPlugin.activeImportedPlugins();
    console.log(`✅ Imported plugins loaded: ${importedPlugins.length}`);
    importedPlugins.forEach(plugin => console.log(`   - ${plugin.name || 'Unnamed'}`));
  } catch (error) {
    console.error("❌ Error loading imported plugins:", error.message);
  }
  
  console.log("\n4. Testing agent flows...");
  try {
    const flows = AgentFlows.activeFlowPlugins();
    console.log(`✅ Agent flows loaded: ${flows.length}`);
    flows.forEach(flow => console.log(`   - ${flow.name || 'Unnamed'}`));
  } catch (error) {
    console.error("❌ Error loading agent flows:", error.message);
  }
  
  console.log("\n5. Testing full WORKSPACE_AGENT definition...");
  try {
    const workspaceAgent = await WORKSPACE_AGENT.getDefinition("togetherai", "test-workspace");
    console.log(`✅ WORKSPACE_AGENT loaded with ${workspaceAgent.functions?.length || 0} functions`);
    if (workspaceAgent.functions) {
      console.log("Functions:");
      workspaceAgent.functions.forEach(fn => console.log(`   - ${fn.name}: ${fn.description?.substring(0, 60)}...`));
    }
  } catch (error) {
    console.error("❌ Error loading WORKSPACE_AGENT:", error.message);
    console.error(error.stack);
  }
}

testAgentFunctions().catch(console.error);