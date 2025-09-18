# Google Drive MCP Integration

This directory contains the Google Drive integration for AnythingLLM's Model Context Protocol (MCP) system, providing comprehensive document management and synchronization capabilities.

## Overview

The Google Drive MCP integration consists of two main components:

1. **Nango Integration** (`/nango-integrations/google-drive/`) - Handles document synchronization and content fetching
2. **Universal MCP Server** (`/server/universal-google-drive-mcp.js`) - Provides real-time Google Drive operations through MCP tools

## Architecture

### Nango Integration Components

#### 1. Configuration (`nango.yaml`)
Defines the integration structure with two main capabilities:
- **Sync**: `documents` - Automatically syncs Google Drive files every 30 minutes
- **Action**: `fetch-document` - Retrieves individual file content on demand

#### 2. Document Sync (`syncs/documents.ts`)
**Purpose**: Continuously monitors and syncs Google Drive documents to the workspace.

**Key Features**:
- Recursive folder processing with deduplication
- Batch processing (100 files per batch) for performance
- Support for both specific files and entire folders
- Automatic filtering of trashed files
- Cross-drive support for shared drives


#### 3. Document Fetching (`actions/fetch-document.ts`)
**Purpose**: Retrieves the actual content of Google Drive files.

**Key Features**:
- Smart MIME type handling with automatic export conversion
- File size validation (10MB limit)
- Support for Google Workspace files (Docs, Sheets, Slides)
- Base64 encoding for binary files
- Comprehensive error handling

**Supported File Types**:
- Google Docs → Word/PDF/Plain text export
- Google Sheets → Excel/CSV export
- Google Slides → PowerPoint export
- PDFs, images, text files (direct download)

#### 4. Type Definitions (`types.ts`)
Comprehensive TypeScript interfaces including:
- `GoogleDriveFileResponse` - File metadata structure
- `mimeTypeMapping` - MIME type conversion rules
- `DriveCapabilities` - Permission and capability definitions

## Universal MCP Server

The Universal MCP Server (`/server/universal-google-drive-mcp.js`) provides real-time Google Drive operations through 6 MCP tools:

### Available Tools

#### 1. `list_files`
Lists files and folders from Google Drive with advanced filtering.

**Parameters**:
- `folderId` (optional) - Specific folder ID (default: root)
- `maxResults` (optional) - Limit results (default: 50)
- `query` (optional) - Google Drive search query
- `orderBy` (optional) - Sort order (name, modifiedTime, size)
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// List root folder
{ "folderId": "root", "maxResults": 10 }

// Search for PDFs
{ "query": "mimeType='application/pdf'", "maxResults": 20 }

// List files in specific folder
{ "folderId": "1A2B3C4D5E6F", "orderBy": "modifiedTime desc" }
```

#### 2. `get_file_content`
Retrieves the content of Google Drive files with automatic format conversion.

**Parameters**:
- `fileId` (required) - Google Drive file ID
- `mimeType` (optional) - Export format for Google Workspace files
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// Get Google Doc as plain text
{ "fileId": "1A2B3C4D5E6F", "mimeType": "text/plain" }

// Get any file with default export
{ "fileId": "1A2B3C4D5E6F" }
```



# TODO: NOT WORKING FROM LOCAL COMPUTER 
--------------------------------------------
--------------------------------------------
#### 3. `upload_file` 
Uploads new files to Google Drive with multipart upload support.

**Parameters**:
- `name` (required) - File name
- `content` (required) - File content (base64 for binary)
- `mimeType` (optional) - File MIME type (default: text/plain)
- `folderId` (optional) - Parent folder ID (default: root)
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// Upload text file
{
  "name": "notes.txt",
  "content": "Hello World!",
  "mimeType": "text/plain"
}

// Upload to specific folder
{
  "name": "document.pdf",
  "content": "base64EncodedContent...",
  "mimeType": "application/pdf",
  "folderId": "1A2B3C4D5E6F"
}
```

#### 4. `create_folder`
Creates new folders in Google Drive with hierarchical support.

**Parameters**:
- `name` (required) - Folder name
- `parentId` (optional) - Parent folder ID (default: root)
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// Create folder in root
{ "name": "My New Folder" }

// Create subfolder
{ "name": "Subfolder", "parentId": "1A2B3C4D5E6F" }
```

#### 5. `share_file`
Manages file and folder sharing permissions.

**Parameters**:
- `fileId` (required) - File/folder ID to share
- `email` (optional) - Email address to share with
- `role` (optional) - Permission level (reader, writer, commenter)
- `type` (optional) - Permission type (user, group, domain, anyone)
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// Share with specific user
{
  "fileId": "1A2B3C4D5E6F",
  "email": "user@example.com",
  "role": "writer"
}

// Make public (read-only)
{
  "fileId": "1A2B3C4D5E6F",
  "type": "anyone",
  "role": "reader"
}
```

#### 6. `get_synced_documents`
Retrieves documents that have been synced to the workspace through the Nango integration.

**Parameters**:
- `limit` (optional) - Maximum documents to return (default: 20)
- `workspaceId` (optional) - Auto-detected from context

**Example Usage**:
```javascript
// Get recent synced documents
{ "limit": 10 }
```

## Workspace Detection

The Universal MCP Server uses a sophisticated workspace detection system with the following priority:

1. **Explicit `workspaceId`** in function arguments (highest priority)
2. **Environment variable** `NANGO_CONNECTION_ID`
3. **MCP server name** pattern matching `_ws(\d+)$`
4. **Default fallback** to workspace `1`

This enables dynamic multi-workspace support without hardcoding workspace configurations.

## Authentication & Security

### OAuth Flow
- Uses Nango for secure OAuth 2.0 authentication with Google
- Requires `NANGO_SECRET_KEY` and `NANGO_HOST` environment variables
- Connection IDs follow pattern: `workspace_{workspaceId}`

### Required Scopes
- `https://www.googleapis.com/auth/drive.readonly` - Read access to Google Drive
- Additional write scopes automatically requested for upload/create operations

### Security Features
- File size limits (10MB for content fetching)
- Input validation and sanitization
- Error isolation per workspace
- Secure token management through Nango

## Error Handling

The integration provides comprehensive error handling:

1. **Connection Errors** - Invalid authentication or network issues
2. **Permission Errors** - Insufficient Google Drive permissions
3. **File Errors** - File not found, too large, or unsupported format
4. **Rate Limiting** - Automatic retries with exponential backoff
5. **Workspace Errors** - Invalid or missing workspace configuration

All errors include descriptive messages and suggested resolutions.

## Performance Optimization

### Batch Processing
- Document sync processes files in batches of 100
- Prevents memory overflow for large drives
- Efficient database operations

### Caching Strategy
- Synced documents cached in workspace database
- Metadata cached to reduce API calls
- Incremental updates for changed files only

### Rate Limiting
- Built-in retry logic (up to 10 retries)
- Exponential backoff for failed requests
- Respects Google Drive API quotas

