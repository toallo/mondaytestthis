# Filesystem MCP Tool - Architecture Documentation

## Overview

This project implements a filesystem tool using the Model Context Protocol (MCP), demonstrating how AI assistants can interact with file systems in a structured, secure manner.

## Architecture Components

### 1. MCP Server (`src/index.js`)

The core component that exposes filesystem operations through the MCP protocol.

```
┌─────────────────────────────────────┐
│     MCP Server (stdio transport)    │
├─────────────────────────────────────┤
│  - Tool Registration                │
│  - Request Routing                  │
│  - Path Validation & Security       │
│  - Error Handling                   │
└─────────────────────────────────────┘
           │
           ├── read_file
           ├── write_file
           ├── list_directory
           ├── create_directory
           ├── delete_file
           ├── get_file_info
           ├── move_file
           ├── copy_file
           └── search_files
```

**Key Features:**
- Path validation to prevent directory traversal attacks
- Sandboxing to allowed directories
- Comprehensive error handling
- Support for both simple and complex operations

### 2. MCP Client (`src/filesystem-client.js`)

A client implementation that connects to the MCP server and provides a clean API for filesystem operations.

```
┌─────────────────────────────────────┐
│     MCP Client                       │
├─────────────────────────────────────┤
│  - Connection Management            │
│  - Tool Discovery                   │
│  - Request/Response Handling        │
│  - High-level API Methods           │
└─────────────────────────────────────┘
           │
           ▼
    [Stdio Transport]
           │
           ▼
     [MCP Server]
```

**Usage:**
```javascript
const client = new FilesystemMCPClient();
await client.connect('node', ['src/index.js']);
const content = await client.readFile('path/to/file.txt');
```

### 3. Demo Application (`src/demo.js`)

An interactive demonstration that showcases all filesystem MCP tool capabilities.

**Demonstrates:**
- Creating directory structures
- Writing various file types (JSON, text, CSV)
- Reading and processing files
- Searching and filtering
- Data transformation workflows

### 4. Test Suite (`src/test-filesystem.js`)

Comprehensive tests covering all filesystem operations.

**Test Coverage:**
- Basic operations (read, write, delete)
- Directory management
- File metadata operations
- Copy and move operations
- Edge cases (empty files, large files, UTF-8)
- Error handling

## Data Flow

### Request Flow

```
User/AI Assistant
      │
      ▼
[Client API Call]
      │
      ▼
[MCP Client Layer]
      │
      ▼
[Stdio Transport] ──serialize──▶ JSON-RPC message
      │
      ▼
[Stdio Transport] ──stdin/stdout──▶
      │
      ▼
[MCP Server Layer]
      │
      ▼
[Request Handler]
      │
      ├── Validate Path
      ├── Check Permissions
      └── Execute Operation
            │
            ▼
      [Node.js fs module]
            │
            ▼
      [File System]
```

### Response Flow

```
[File System]
      │
      ▼
[Operation Result]
      │
      ▼
[Format Response]
      │
      ▼
[MCP Server Layer]
      │
      ▼
[Stdio Transport] ──stdout──▶ JSON-RPC response
      │
      ▼
[MCP Client Layer]
      │
      ▼
[Parse & Return]
      │
      ▼
User/AI Assistant
```

## Security Model

### Path Validation

All file paths are validated before operations:

```javascript
validatePath(filePath) {
  const resolved = path.resolve(filePath);
  const isAllowed = this.allowedPaths.some(allowedPath =>
    resolved.startsWith(allowedPath)
  );
  
  if (!isAllowed) {
    throw new Error('Access denied');
  }
  
  return resolved;
}
```

### Sandboxing

The server is initialized with allowed paths:

```javascript
const server = new FilesystemMCPServer([
  '/allowed/path1',
  '/allowed/path2'
]);
```

All operations are restricted to these directories.

### Error Handling

Errors are caught and returned in a structured format:

```javascript
{
  content: [{ type: 'text', text: 'Error: ...' }],
  isError: true
}
```

## Protocol Details

### Tool Schema

Each tool is defined with:
- `name`: Unique identifier
- `description`: Human-readable description
- `inputSchema`: JSON Schema for parameters

Example:
```javascript
{
  name: 'read_file',
  description: 'Read the complete contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read'
      }
    },
    required: ['path']
  }
}
```

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "file contents here"
      }
    ]
  }
}
```

## Extension Points

### Adding New Operations

To add a new filesystem operation:

1. **Define the tool** in `ListToolsRequestSchema` handler:
```javascript
{
  name: 'new_operation',
  description: 'Description of operation',
  inputSchema: { /* schema */ }
}
```

2. **Implement the handler** in `CallToolRequestSchema`:
```javascript
case 'new_operation':
  return await this.newOperation(args);
```

3. **Add the method** to the server class:
```javascript
async newOperation(args) {
  // Implementation
  return {
    content: [{ type: 'text', text: 'result' }]
  };
}
```

4. **Add client method** (optional):
```javascript
async newOperation(args) {
  return await this.callTool('new_operation', args);
}
```

### Custom Transports

While this implementation uses stdio transport, MCP supports other transports:

- **HTTP Transport**: For web-based clients
- **WebSocket Transport**: For real-time bidirectional communication
- **Custom Transports**: Implement the transport interface

## Performance Considerations

### Streaming Large Files

For large files, consider implementing streaming:

```javascript
async readFileStream(filePath) {
  const stream = fs.createReadStream(filePath);
  // Stream chunks through MCP
}
```

### Caching

Add caching for frequently accessed files:

```javascript
class FilesystemMCPServer {
  constructor() {
    this.cache = new Map();
  }
  
  async readFile(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }
    // Read and cache
  }
}
```

### Batch Operations

Support batch operations to reduce round trips:

```javascript
async batchOperation(operations) {
  return await Promise.all(
    operations.map(op => this.executeOperation(op))
  );
}
```

## Use Cases

### 1. Configuration Management

```javascript
// Read config
const config = await client.readFile('config.json');
const parsed = JSON.parse(config);

// Update config
parsed.newSetting = 'value';
await client.writeFile('config.json', JSON.stringify(parsed, null, 2));
```

### 2. Log Analysis

```javascript
// Read logs
const logs = await client.readFile('app.log');

// Analyze
const errors = logs.split('\n')
  .filter(line => line.includes('ERROR'));

// Generate report
await client.writeFile('error-report.txt', errors.join('\n'));
```

### 3. Code Generation

```javascript
// Search for template
const templates = await client.searchFiles('templates', '.*\\.tmpl');

// Process template
const template = await client.readFile(templates[0].path);
const code = processTemplate(template, data);

// Write output
await client.writeFile('generated/output.js', code);
```

### 4. Data Pipeline

```javascript
// Read source data
const csvData = await client.readFile('data.csv');

// Transform
const processed = transformData(csvData);

// Write multiple formats
await client.writeFile('output.json', JSON.stringify(processed));
await client.writeFile('output.xml', toXML(processed));
```

## Testing Strategy

### Unit Tests
- Individual operation tests
- Path validation tests
- Error handling tests

### Integration Tests
- End-to-end workflow tests
- Multiple operations in sequence
- Client-server communication

### Security Tests
- Directory traversal attempts
- Unauthorized access tests
- Permission validation

## Deployment

### Development

```bash
npm install
npm run demo  # Run demonstration
npm test      # Run tests
```

### Production

```bash
# Start server with specific allowed paths
node src/index.js /allowed/path1 /allowed/path2
```

### Docker (Future Enhancement)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
CMD ["node", "src/index.js"]
```

## Future Enhancements

1. **File Watching**: Monitor files for changes
2. **Streaming Support**: Handle large files efficiently
3. **Compression**: Automatic compression for large data
4. **Encryption**: Encrypt sensitive file contents
5. **Versioning**: Track file changes over time
6. **Quota Management**: Enforce storage limits
7. **Metadata**: Extended file attributes and tags
8. **Search Indexing**: Fast full-text search
9. **Permissions**: Fine-grained access control
10. **Audit Logging**: Track all operations

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Node.js File System API](https://nodejs.org/api/fs.html)
