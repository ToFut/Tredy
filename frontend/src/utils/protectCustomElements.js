/**
 * Protection against external scripts (like browser extensions) 
 * trying to register custom elements that conflict with our app
 */

// Store the original customElements.define method
const originalDefine = window.customElements?.define;

// Override customElements.define to prevent duplicate registrations
if (window.customElements && originalDefine) {
  // Pre-register the problematic element to prevent errors
  const problematicElements = ['mce-autosize-textarea'];
  problematicElements.forEach(name => {
    if (!window.customElements.get(name)) {
      // Register a dummy element to prevent the actual one from being registered
      class DummyElement extends HTMLElement {}
      try {
        window.customElements.define(name, DummyElement);
      } catch (e) {
        // Element might already be defined
      }
    }
  });

  window.customElements.define = function(name, constructor, options) {
    try {
      // Check if element is already defined
      if (window.customElements.get(name)) {
        // Silently skip instead of warning for known extension elements
        if (!name.includes('mce-') && !name.includes('tinymce')) {
          console.warn(`Custom element '${name}' is already defined. Skipping duplicate registration.`);
        }
        return;
      }
      
      // Prevent TinyMCE or other external scripts from registering elements
      if (name.includes('mce-') || name.includes('tinymce')) {
        // Silently block without warning to reduce console noise
        return;
      }
      
      // Call original define method
      return originalDefine.call(this, name, constructor, options);
    } catch (error) {
      // Silently handle errors for external scripts
      if (!name.includes('mce-') && !name.includes('tinymce')) {
        console.error(`Error registering custom element '${name}':`, error);
      }
    }
  };
}

// Prevent external scripts from modifying our app
export function protectApp() {
  // Block external overlay scripts
  if (typeof window !== 'undefined') {
    // Prevent common extension injections
    const blockedScripts = ['overlay_bundle.js', 'webcomponents-ce.js'];
    
    // Override appendChild to block certain scripts
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
      if (child.tagName === 'SCRIPT' && child.src) {
        const scriptName = child.src.split('/').pop();
        if (blockedScripts.some(blocked => scriptName.includes(blocked))) {
          console.warn(`Blocked external script injection: ${scriptName}`);
          return child;
        }
      }
      return originalAppendChild.call(this, child);
    };
  }
}

export default protectApp;