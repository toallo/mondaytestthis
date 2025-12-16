# Filesystem MCP Tool Demonstration

This project demonstrates the capabilities of the **filesystem MCP tool** for reading, writing, and managing files using the Model Context Protocol (MCP).

> **Note:** This implementation includes both Python and JavaScript/Node.js versions. The Python version is fully functional and can be run immediately. The JavaScript version demonstrates the implementation patterns for when the MCP SDK becomes available.

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that enables AI assistants to interact with external tools and services. The filesystem MCP tool provides secure, structured access to file system operations.

## Filesystem MCP Tool Capabilities

The filesystem MCP tool provides the following operations:

### 1. **Reading Files**
- Read file contents (text or binary)
- Read file metadata (size, permissions, timestamps)
- List directory contents
- Search for files by pattern

### 2. **Writing Files**
- Create new files
- Update existing files
- Append to files
- Set file permissions

### 3. **Directory Management**
- Create directories (with recursive support)
- Remove directories
- List directory contents recursively
- Check if paths exist

### 4. **File Operations**
- Copy files
- Move/rename files
- Delete files
- Get file statistics

## Project Structure

```
.
├── README.md                       # This file
├── ARCHITECTURE.md                 # Detailed architecture documentation
├── USAGE_GUIDE.md                  # Comprehensive usage guide
├── package.json                    # Node.js dependencies (for future use)
├── src/
│   ├── filesystem_mcp_server.py    # Python MCP server implementation ✓
│   ├── demo.py                     # Python interactive demonstration ✓
│   ├── test_filesystem.py          # Python test suite ✓
│   ├── index.js                    # JavaScript MCP server (for reference)
│   ├── demo.js                     # JavaScript demo (for reference)
│   ├── test-filesystem.js          # JavaScript tests (for reference)
│   └── filesystem-client.js        # JavaScript MCP client (for reference)
└── examples/
    ├── sample-data/                # Sample files for testing
    └── output/                     # Output directory for demos
```

## Quick Start (Python)

The Python implementation is ready to use immediately:

```bash
# Run the interactive demonstration
python3 src/demo.py

# Run the test suite
python3 src/test_filesystem.py

# Use the server directly
python3 src/filesystem_mcp_server.py
```

## Quick Start (JavaScript/Node.js)

The JavaScript implementation requires Node.js and the MCP SDK:

```bash
# Install Node.js dependencies (when SDK is available)
npm install

# Run the JavaScript demo
npm run demo

# Run the JavaScript tests
npm test
```

## Python Implementation

```bash
npm start
```

### Run the Demo

Execute the interactive demonstration:

```bash
npm run demo
```

### Run Tests

Test filesystem operations:

```bash
npm test
```

## How the Filesystem MCP Tool Works

### 1. Server Setup

The MCP server exposes filesystem tools through standardized endpoints:

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'filesystem-server',
  version: '1.0.0'
});

// Register filesystem tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: { /* ... */ }
      },
      // ... more tools
    ]
  };
});
```

### 2. Tool Implementation

Each filesystem operation is implemented as a tool:

```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'read_file':
      return await readFile(args.path);
    case 'write_file':
      return await writeFile(args.path, args.content);
    // ... more operations
  }
});
```

### 3. Client Usage

Clients interact with the MCP server to perform filesystem operations:

```javascript
// Read a file
const content = await client.callTool('read_file', {
  path: '/path/to/file.txt'
});

// Write a file
await client.callTool('write_file', {
  path: '/path/to/output.txt',
  content: 'Hello, MCP!'
});

// List directory
const files = await client.callTool('list_directory', {
  path: '/path/to/dir'
});
```

## Security Considerations

The filesystem MCP tool implements several security measures:

1. **Path Validation**: All paths are validated to prevent directory traversal attacks
2. **Sandboxing**: Operations are restricted to allowed directories
3. **Permission Checks**: File permissions are verified before operations
4. **Error Handling**: Comprehensive error handling prevents information leakage

## Example Use Cases

### 1. Configuration Management

```javascript
// Read configuration
const config = await client.callTool('read_file', {
  path: './config.json'
});

// Update configuration
await client.callTool('write_file', {
  path: './config.json',
  content: JSON.stringify(updatedConfig, null, 2)
});
```

### 2. Log File Analysis

```javascript
// Read logs
const logs = await client.callTool('read_file', {
  path: './logs/app.log'
});

// Parse and analyze
const errors = logs.split('\n').filter(line => line.includes('ERROR'));

// Write summary
await client.callTool('write_file', {
  path: './logs/error-summary.txt',
  content: errors.join('\n')
});
```

### 3. Batch File Processing

```javascript
// List all text files
const files = await client.callTool('list_directory', {
  path: './data',
  pattern: '*.txt'
});

// Process each file
for (const file of files) {
  const content = await client.callTool('read_file', {
    path: file.path
  });
  
  const processed = processContent(content);
  
  await client.callTool('write_file', {
    path: `./output/${file.name}`,
    content: processed
  });
}
```

## API Reference

### read_file

Read the contents of a file.

**Parameters:**
- `path` (string): Path to the file
- `encoding` (string, optional): File encoding (default: 'utf8')

**Returns:** File content as string

### write_file

Write content to a file.

**Parameters:**
- `path` (string): Path to the file
- `content` (string): Content to write
- `encoding` (string, optional): File encoding (default: 'utf8')

**Returns:** Success status

### list_directory

List contents of a directory.

**Parameters:**
- `path` (string): Path to the directory
- `recursive` (boolean, optional): List recursively (default: false)

**Returns:** Array of file/directory information

### create_directory

Create a new directory.

**Parameters:**
- `path` (string): Path to the directory
- `recursive` (boolean, optional): Create parent directories (default: false)

**Returns:** Success status

### delete_file

Delete a file.

**Parameters:**
- `path` (string): Path to the file

**Returns:** Success status

### get_file_info

Get file metadata.

**Parameters:**
- `path` (string): Path to the file

**Returns:** File statistics (size, permissions, timestamps)

### move_file

Move or rename a file.

**Parameters:**
- `source` (string): Source path
- `destination` (string): Destination path

**Returns:** Success status

### copy_file

Copy a file.

**Parameters:**
- `source` (string): Source path
- `destination` (string): Destination path

**Returns:** Success status

## Benefits of Using MCP for Filesystem Operations

1. **Standardization**: Consistent interface across different implementations
2. **Security**: Built-in security features and sandboxing
3. **Extensibility**: Easy to add custom filesystem operations
4. **Integration**: Works seamlessly with AI assistants and automation tools
5. **Logging**: Automatic logging and auditing of filesystem operations

## Learn More

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers)

## Contributing

Feel free to extend this demonstration with additional filesystem operations or use cases!
