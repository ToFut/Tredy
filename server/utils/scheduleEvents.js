/**
 * Schedule Events Broadcasting System
 * Manages WebSocket events for scheduled agent executions
 */

// Store active WebSocket connections by workspace
const workspaceConnections = new Map();

/**
 * Register a WebSocket connection for a workspace
 */
function registerConnection(workspaceId, socket) {
  if (!workspaceConnections.has(workspaceId)) {
    workspaceConnections.set(workspaceId, new Set());
  }
  workspaceConnections.get(workspaceId).add(socket);

  // Clean up on disconnect
  socket.on("close", () => {
    const connections = workspaceConnections.get(workspaceId);
    if (connections) {
      connections.delete(socket);
      if (connections.size === 0) {
        workspaceConnections.delete(workspaceId);
      }
    }
  });
}

/**
 * Broadcast an event to all connected clients in a workspace
 */
function broadcastScheduleEvent(workspaceId, eventType, data) {
  const connections = workspaceConnections.get(workspaceId);
  if (!connections || connections.size === 0) {
    console.log(
      `[ScheduleEvents] No active connections for workspace ${workspaceId}`
    );
    return;
  }

  const message = JSON.stringify({
    type: eventType,
    ...data,
  });

  connections.forEach((socket) => {
    try {
      if (socket.readyState === 1) {
        // OPEN state
        socket.send(message);
      }
    } catch (error) {
      console.error(`[ScheduleEvents] Error broadcasting to socket:`, error);
    }
  });

  console.log(
    `[ScheduleEvents] Broadcasted ${eventType} to ${connections.size} clients in workspace ${workspaceId}`
  );
}

/**
 * Emit schedule progress updates
 */
function emitProgress(
  workspaceId,
  scheduleId,
  scheduleName,
  progress,
  message
) {
  broadcastScheduleEvent(workspaceId, "schedule:progress", {
    scheduleId,
    scheduleName,
    progress,
    message,
    timestamp: new Date(),
  });
}

/**
 * Get active connections count for a workspace
 */
function getConnectionCount(workspaceId) {
  const connections = workspaceConnections.get(workspaceId);
  return connections ? connections.size : 0;
}

module.exports = {
  registerConnection,
  broadcastScheduleEvent,
  emitProgress,
  getConnectionCount,
  workspaceConnections,
};
