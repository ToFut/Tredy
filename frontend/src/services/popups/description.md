# Popup Services

This directory contains popup utility modules for handling authentication flows and credential collection in the Tredy frontend application.

## Files

### CredentialsPopup.js
- **Purpose**: General-purpose credentials popup for username/password authentication
- **Function**: `showCredentialsPopup(providerConfigKey)`
- **Returns**: Promise resolving to `{username, password}` or `null` if cancelled
- **Features**:
  - Adapts labels based on provider (e.g., "Account SID"/"Auth Token" for Twilio)
  - Modal overlay with form validation
  - Keyboard shortcuts (Enter to submit, Escape to cancel)
  - Click-outside-to-close functionality
  - Auto-focus on username field

### WhatsAppPopup.js
- **Purpose**: Specialized popup for WhatsApp API key authentication
- **Function**: `showWhatsAppPopup(providerConfigKey)`
- **Returns**: Promise resolving to `{apiKey}` or `null` if cancelled
- **Features**:
  - Single API key input field
  - WhatsApp-branded styling (green connect button)
  - Helpful placeholder text and guidance
  - Same UX patterns as CredentialsPopup

## Common Features

Both popup utilities share:
- **Modal Design**: Full-screen overlay with centered popup
- **Responsive**: Max-width constraints for mobile compatibility
- **Accessible**: Proper focus management and keyboard navigation
- **Styled**: Inline CSS with modern design system
- **Promise-based**: Async/await compatible API
- **Error Handling**: Form validation with user feedback
- **Escape Hatches**: Multiple ways to cancel (button, ESC key, click outside)

## Usage Pattern

```javascript
import { showCredentialsPopup } from './popups/CredentialsPopup.js';
import { showWhatsAppPopup } from './popups/WhatsAppPopup.js';

// For general providers
const credentials = await showCredentialsPopup('twilio');
if (credentials) {
  // Handle {username, password}
}

// For WhatsApp specifically
const whatsappCreds = await showWhatsAppPopup('whatsapp');
if (whatsappCreds) {
  // Handle {apiKey}
}
```

## Integration

These popups are designed to work within the Tredy authentication flow, likely called from Nango service or similar authentication handlers when OAuth flows are not available or API keys are required.