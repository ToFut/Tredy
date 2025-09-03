// Base interfaces for document handling
const { systemEvents } = require('./systemInterfaces');

const DOCUMENT_STATES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
};

const DOCUMENT_TYPES = {
  TEXT: 'text',
  PDF: 'pdf',
  DOCX: 'docx',
  HTML: 'html',
};

// Base document event handlers
function emitDocumentEvent(eventType, data) {
  systemEvents.emit(`document:${eventType}`, data);
}

function onDocumentEvent(eventType, callback) {
  systemEvents.on(`document:${eventType}`, callback);
}

module.exports = {
  DOCUMENT_STATES,
  DOCUMENT_TYPES,
  emitDocumentEvent,
  onDocumentEvent,
};
