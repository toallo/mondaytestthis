# Filesystem MCP Tool - Usage Guide

This guide provides detailed instructions and examples for using the Filesystem MCP tool.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Running the Demo](#running-the-demo)
4. [Using the MCP Server](#using-the-mcp-server)
5. [Using the Client API](#using-the-client-api)
6. [Common Use Cases](#common-use-cases)
7. [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Install dependencies (when @modelcontextprotocol/sdk is available)
npm install

# Run the demonstration
npm run demo

# Run tests
npm test
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone or navigate to the repository:
```bash
cd /path/to/filesystem-mcp-demo
```

2. Install dependencies:
```bash
npm install
```

Note: This demo includes a `package.json` that references the MCP SDK. If the SDK is not yet published, the implementation files demonstrate the patterns and can be adapted once the SDK is available.

## Running the Demo

The demo script showcases all filesystem operations:

```bash
npm run demo
```

### What the Demo Does

1. **Creates directory structure**
   - `examples/sample-data/` for input files
   - `examples/output/` for processed files

2. **Writes sample files**
   - JSON configuration file
   - Plain text file
   - CSV data file

3. **Demonstrates reading**
   - Reads and displays file contents
   - Shows file metadata

4. **Shows directory operations**
   - Lists directory contents
   - Recursive directory listing

5. **Performs file operations**
   - Copies files
   - Searches for files by pattern

6. **Processes data**
   - Reads CSV data
   - Transforms and writes JSON

7. **Generates reports**
   - Creates summary report
   - Shows final directory structure

### Demo Output

The demo creates colorized output showing:
- ✓ Success messages in green
- ℹ Information in cyan
- Section headers in blue
- Data content in yellow

## Using the MCP Server

### Starting the Server

```bash
node src/index.js [allowed-paths...]
```

Examples:

```bash
# Allow access to current directory
node src/index.js .

# Allow multiple directories
node src/index.js /home/user/projects /home/user/documents

# Allow specific project directory
node src/index.js /home/user/myproject
```

### Server Configuration

The server accepts paths as command-line arguments. All filesystem operations are restricted to these paths.

**Security Note:** Only specify trusted directories. The server will reject any operations outside these paths.

## Using the Client API

### Basic Client Setup

```javascript
import FilesystemMCPClient from './src/filesystem-client.js';

const client = new FilesystemMCPClient();

// Connect to server
await client.connect('node', ['src/index.js', process.cwd()]);

// Perform operations
const content = await client.readFile('myfile.txt');

// Disconnect when done
await client.disconnect();
```

### Client API Reference

#### Reading Files

```javascript
// Read a text file
const content = await client.readFile('path/to/file.txt');
console.log(content);

// Read JSON file
const jsonContent = await client.readFile('config.json');
const data = JSON.parse(jsonContent);
```

#### Writing Files

```javascript
// Write text
await client.writeFile('output.txt', 'Hello, World!');

// Write JSON
await client.writeFile('data.json', JSON.stringify(data, null, 2));

// Write CSV
const csv = 'name,value\nItem,100';
await client.writeFile('data.csv', csv);
```

#### Directory Operations

```javascript
// Create directory
await client.createDirectory('new-folder');

// Create nested directories
await client.createDirectory('parent/child/grandchild', true);

// List directory (non-recursive)
const files = await client.listDirectory('path/to/dir');
files.forEach(file => {
  console.log(`${file.name} (${file.type})`);
});

// List directory (recursive)
const allFiles = await client.listDirectory('path/to/dir', true);
```

#### File Information

```javascript
// Get file metadata
const info = await client.getFileInfo('myfile.txt');
console.log(`Size: ${info.size} bytes`);
console.log(`Modified: ${info.modified}`);
console.log(`Is file: ${info.isFile}`);
console.log(`Permissions: ${info.permissions}`);
```

#### File Operations

```javascript
// Copy file
await client.copyFile('source.txt', 'destination.txt');

// Move/rename file
await client.moveFile('old-name.txt', 'new-name.txt');

// Delete file
await client.deleteFile('unwanted.txt');
```

#### Searching

```javascript
// Search for all .txt files
const txtFiles = await client.searchFiles('path/to/dir', '.*\\.txt');

// Search for files starting with 'test'
const testFiles = await client.searchFiles('path/to/dir', 'test.*');

// Search for files with pattern
const matches = await client.searchFiles('logs', '.*-2024-.*\\.log');
```

## Common Use Cases

### 1. Configuration File Management

```javascript
import FilesystemMCPClient from './src/filesystem-client.js';

async function updateConfig(newSettings) {
  const client = new FilesystemMCPClient();
  await client.connect('node', ['src/index.js', process.cwd()]);
  
  try {
    // Read existing config
    const configStr = await client.readFile('config.json');
    const config = JSON.parse(configStr);
    
    // Update settings
    Object.assign(config, newSettings);
    
    // Write back
    await client.writeFile('config.json', JSON.stringify(config, null, 2));
    
    console.log('Configuration updated successfully');
  } finally {
    await client.disconnect();
  }
}

// Usage
await updateConfig({ theme: 'dark', language: 'en' });
```

### 2. Log File Analysis

```javascript
async function analyzeLogs(logPath) {
  const client = new FilesystemMCPClient();
  await client.connect('node', ['src/index.js', process.cwd()]);
  
  try {
    // Read log file
    const logs = await client.readFile(logPath);
    
    // Analyze
    const lines = logs.split('\n');
    const errors = lines.filter(line => line.includes('ERROR'));
    const warnings = lines.filter(line => line.includes('WARN'));
    
    // Generate report
    const report = `
Log Analysis Report
===================
Total lines: ${lines.length}
Errors: ${errors.length}
Warnings: ${warnings.length}

Recent Errors:
${errors.slice(-10).join('\n')}
    `.trim();
    
    // Save report
    await client.writeFile('log-analysis.txt', report);
    
    return { errors: errors.length, warnings: warnings.length };
  } finally {
    await client.disconnect();
  }
}

// Usage
const stats = await analyzeLogs('app.log');
console.log(`Found ${stats.errors} errors and ${stats.warnings} warnings`);
```

### 3. Batch File Processing

```javascript
async function processTextFiles(inputDir, outputDir, transformer) {
  const client = new FilesystemMCPClient();
  await client.connect('node', ['src/index.js', process.cwd()]);
  
  try {
    // Create output directory
    await client.createDirectory(outputDir);
    
    // Find all text files
    const files = await client.searchFiles(inputDir, '.*\\.txt');
    
    // Process each file
    for (const file of files) {
      const content = await client.readFile(file.path);
      const processed = transformer(content);
      
      const outputPath = `${outputDir}/${file.name}`;
      await client.writeFile(outputPath, processed);
      
      console.log(`Processed: ${file.name}`);
    }
    
    console.log(`Processed ${files.length} files`);
  } finally {
    await client.disconnect();
  }
}

// Usage: Convert text to uppercase
await processTextFiles(
  'input',
  'output',
  (text) => text.toUpperCase()
);
```

### 4. Data Export Pipeline

```javascript
async function exportData(data, format) {
  const client = new FilesystemMCPClient();
  await client.connect('node', ['src/index.js', process.cwd()]);
  
  try {
    await client.createDirectory('exports');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'json':
        await client.writeFile(
          `exports/data-${timestamp}.json`,
          JSON.stringify(data, null, 2)
        );
        break;
        
      case 'csv':
        const csv = convertToCSV(data);
        await client.writeFile(
          `exports/data-${timestamp}.csv`,
          csv
        );
        break;
        
      case 'txt':
        const text = data.map(row => JSON.stringify(row)).join('\n');
        await client.writeFile(
          `exports/data-${timestamp}.txt`,
          text
        );
        break;
    }
    
    console.log(`Data exported as ${format}`);
  } finally {
    await client.disconnect();
  }
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(h => JSON.stringify(obj[h] || '')).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// Usage
await exportData([
  { id: 1, name: 'Item A', value: 100 },
  { id: 2, name: 'Item B', value: 200 }
], 'csv');
```

### 5. Project Scaffolding

```javascript
async function createProject(projectName, template) {
  const client = new FilesystemMCPClient();
  await client.connect('node', ['src/index.js', process.cwd()]);
  
  try {
    // Create project structure
    await client.createDirectory(`${projectName}/src`);
    await client.createDirectory(`${projectName}/tests`);
    await client.createDirectory(`${projectName}/docs`);
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: `${projectName} project`,
      main: 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        test: 'node tests/test.js'
      }
    };
    
    await client.writeFile(
      `${projectName}/package.json`,
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create README
    await client.writeFile(
      `${projectName}/README.md`,
      `# ${projectName}\n\nProject description here.`
    );
    
    // Create main file
    await client.writeFile(
      `${projectName}/src/index.js`,
      `console.log('Hello from ${projectName}!');\n`
    );
    
    console.log(`Project ${projectName} created successfully!`);
  } finally {
    await client.disconnect();
  }
}

// Usage
await createProject('my-new-app', 'node');
```

## Troubleshooting

### Common Issues

#### 1. "Access denied" Error

**Problem:** Trying to access files outside allowed directories.

**Solution:** Ensure the server is started with the correct allowed paths:
```bash
node src/index.js /path/to/your/project
```

#### 2. "File not found" Error

**Problem:** File path is incorrect or file doesn't exist.

**Solution:** Check the file path and use absolute or proper relative paths:
```javascript
// Use path.resolve for absolute paths
import path from 'path';
const filePath = path.resolve(process.cwd(), 'myfile.txt');
```

#### 3. "Permission denied" Error

**Problem:** Insufficient file system permissions.

**Solution:** Check file permissions and ensure the Node.js process has access:
```bash
chmod 644 myfile.txt  # For files
chmod 755 mydirectory  # For directories
```

#### 4. Large File Issues

**Problem:** Reading very large files causes memory issues.

**Solution:** For large files, consider processing in chunks or using streaming (future enhancement).

#### 5. Connection Issues

**Problem:** Client can't connect to server.

**Solution:** Ensure the server is running and transport is configured correctly:
```javascript
// Check if server process is running
// Verify stdio transport is working
await client.connect('node', ['src/index.js', process.cwd()]);
```

### Debug Mode

Enable detailed logging:

```javascript
// Add console.error for debugging in server
console.error('Operation:', name, 'Args:', args);

// Add try-catch with detailed errors
try {
  await client.readFile('test.txt');
} catch (error) {
  console.error('Detailed error:', error);
  console.error('Stack:', error.stack);
}
```

## Best Practices

### 1. Always Close Connections

```javascript
const client = new FilesystemMCPClient();
try {
  await client.connect(...);
  // Do work
} finally {
  await client.disconnect();
}
```

### 2. Validate Paths

```javascript
import path from 'path';

function validatePath(filePath) {
  const resolved = path.resolve(filePath);
  // Check if path is safe
  return resolved;
}
```

### 3. Handle Errors Gracefully

```javascript
try {
  const content = await client.readFile('file.txt');
} catch (error) {
  if (error.message.includes('ENOENT')) {
    console.log('File not found, creating new one...');
    await client.writeFile('file.txt', 'default content');
  } else {
    throw error;
  }
}
```

### 4. Use Appropriate Encodings

```javascript
// Text files - UTF-8 (default)
await client.writeFile('text.txt', content);

// For binary files, consider using base64
const base64 = Buffer.from(binaryData).toString('base64');
await client.writeFile('data.bin.b64', base64);
```

### 5. Batch Operations

```javascript
// Instead of multiple individual calls
for (const file of files) {
  await client.readFile(file);  // Slow
}

// Use Promise.all for parallel operations
const contents = await Promise.all(
  files.map(file => client.readFile(file))
);
```

## Additional Resources

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP docs

## Support

For issues or questions:
1. Check this guide and the README
2. Review the demo code for examples
3. Check the test suite for usage patterns
