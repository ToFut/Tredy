const { log, conclude } = require("./helpers/index.js");
const { getSchedulingEngine } = require("../utils/agents/scheduler/engine");

/**
 * Background worker job for agent scheduling
 * This runs as a separate process/thread and manages all scheduled agent executions
 */
(async () => {
  log("Starting agent scheduler job...");
  
  const engine = getSchedulingEngine();
  
  try {
    // Start the scheduling engine
    await engine.start();
    
    log(`Agent scheduler started with ${engine.getStatus().activeSchedules} active schedules`);

    // Keep the worker alive
    // The engine will handle all scheduling internally
    const heartbeatInterval = setInterval(() => {
      const status = engine.getStatus();
      log(`Scheduler heartbeat - Active schedules: ${status.activeSchedules}, Total executions: ${status.totalExecutions}`);
    }, 60000); // Every minute

    // Handle shutdown gracefully
    const shutdown = async () => {
      log("Shutting down agent scheduler...");
      clearInterval(heartbeatInterval);
      await engine.stop();
      conclude();
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    
    // Keep process alive
    process.stdin.resume();

  } catch (error) {
    log(`Failed to start scheduler: ${error.message}`);
    conclude();
  }
})();