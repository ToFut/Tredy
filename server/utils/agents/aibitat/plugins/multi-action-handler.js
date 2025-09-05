/**
 * Multi-Action Handler Plugin
 * Ensures agents complete all parts of multi-action requests
 * Simple, clean, follows AnythingLLM's original design
 */

const multiActionHandler = {
  name: "multi-action-handler",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "multi-action-handler",
      setup(aibitat) {
        // Track multi-action state
        aibitat.multiAction = {
          active: false,
          totalExpected: 0,
          completed: 0,
          targets: []
        };

        // Wrap handleExecution to detect and ensure completion
        const originalHandleExecution = aibitat.handleExecution;
        if (originalHandleExecution && !originalHandleExecution._multiActionWrapped) {
          aibitat.handleExecution = async function(provider, messages, functions, byAgent) {
            // On first pass, detect if this is a multi-action request
            const userMsg = messages.find(m => m.role === 'user')?.content || '';
            
            if (!aibitat.multiAction.active && userMsg) {
              // Simple detection: multiple emails or "and" pattern
              const emails = userMsg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
              const hasAnd = userMsg.toLowerCase().includes(' and ');
              
              if (emails.length > 1 || (hasAnd && emails.length > 0)) {
                aibitat.multiAction = {
                  active: true,
                  totalExpected: emails.length || 2,
                  completed: 0,
                  targets: emails
                };
                aibitat.introspect(`Detected ${aibitat.multiAction.totalExpected} actions needed`);
              }
            }
            
            // Call original execution
            const result = await originalHandleExecution.apply(this, arguments);
            
            // After execution, check if we're in a multi-action flow
            if (aibitat.multiAction.active) {
              // Check if a function was just called
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.role === 'function') {
                aibitat.multiAction.completed++;
                
                // If not all done and LLM is returning text, force continuation
                if (aibitat.multiAction.completed < aibitat.multiAction.totalExpected) {
                  if (typeof result === 'string' && !result.includes('function')) {
                    const remaining = aibitat.multiAction.targets[aibitat.multiAction.completed];
                    
                    aibitat.introspect(`Progress: ${aibitat.multiAction.completed}/${aibitat.multiAction.totalExpected} complete`);
                    
                    // Add a system message to continue
                    const continueMsg = {
                      role: 'system',
                      content: `You have completed ${aibitat.multiAction.completed} of ${aibitat.multiAction.totalExpected} actions. Now execute the next action for: ${remaining || 'the next target'}. Call the function now.`
                    };
                    
                    // Force another iteration
                    return await this.handleExecution(
                      provider,
                      [...messages, continueMsg],
                      functions,
                      byAgent
                    );
                  }
                } else {
                  // All done
                  aibitat.introspect(`All ${aibitat.multiAction.totalExpected} actions completed!`);
                  aibitat.multiAction.active = false;
                }
              }
            }
            
            return result;
          };
          aibitat.handleExecution._multiActionWrapped = true;
        }
      }
    };
  },
};

module.exports = { multiActionHandler };