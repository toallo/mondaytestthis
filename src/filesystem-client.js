#!/usr/bin/env node

/**
 * Filesystem MCP Client
 * 
 * This client demonstrates how to interact with the Filesystem MCP server
 * using the Model Context Protocol SDK.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class FilesystemMCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  /**
   * Connect to the MCP server
   */
  async connect(serverCommand, serverArgs = []) {
    this.client = new Client({
      name: 'filesystem-client',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
    });

    await this.client.connect(this.transport);
    console.log('Connected to Filesystem MCP Server');
  }

  /**
   * List available tools
   */
  async listTools() {
    const response = await this.client.listTools();
    return response.tools;
  }

  /**
   * Call a tool
   */
  async callTool(name, args) {
    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    if (response.isError) {
      throw new Error(response.content[0].text);
    }

    return response.content[0].text;
  }

  /**
   * Read a file
   */
  async readFile(filePath) {
    return await this.callTool('read_file', { path: filePath });
  }

  /**
   * Write a file
   */
  async writeFile(filePath, content) {
    return await this.callTool('write_file', { path: filePath, content });
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath, recursive = false) {
    const result = await this.callTool('list_directory', {
      path: dirPath,
      recursive,
    });
    return JSON.parse(result);
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath, recursive = true) {
    return await this.callTool('create_directory', {
      path: dirPath,
      recursive,
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    return await this.callTool('delete_file', { path: filePath });
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    const result = await this.callTool('get_file_info', { path: filePath });
    return JSON.parse(result);
  }

  /**
   * Move a file
   */
  async moveFile(source, destination) {
    return await this.callTool('move_file', { source, destination });
  }

  /**
   * Copy a file
   */
  async copyFile(source, destination) {
    return await this.callTool('copy_file', { source, destination });
  }

  /**
   * Search for files
   */
  async searchFiles(dirPath, pattern) {
    const result = await this.callTool('search_files', {
      path: dirPath,
      pattern,
    });
    return JSON.parse(result);
  }

  /**
   * Disconnect from the server
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from Filesystem MCP Server');
    }
  }
}

/**
 * Example usage
 */
async function example() {
  const client = new FilesystemMCPClient();

  try {
    // Connect to the server
    await client.connect('node', ['src/index.js', process.cwd()]);

    // List available tools
    console.log('\nAvailable tools:');
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Create a test directory
    console.log('\nCreating test directory...');
    await client.createDirectory('client-test');

    // Write a file
    console.log('Writing test file...');
    await client.writeFile('client-test/example.txt', 'Hello from MCP client!');

    // Read the file
    console.log('Reading test file...');
    const content = await client.readFile('client-test/example.txt');
    console.log('File content:', content);

    // Get file info
    console.log('\nGetting file information...');
    const info = await client.getFileInfo('client-test/example.txt');
    console.log('File info:', JSON.stringify(info, null, 2));

    // List directory
    console.log('\nListing directory...');
    const files = await client.listDirectory('client-test');
    console.log('Files:', JSON.stringify(files, null, 2));

    // Copy file
    console.log('\nCopying file...');
    await client.copyFile('client-test/example.txt', 'client-test/example-copy.txt');

    // Search for files
    console.log('\nSearching for .txt files...');
    const matches = await client.searchFiles('client-test', '.*\\.txt');
    console.log('Matches:', JSON.stringify(matches, null, 2));

    // Disconnect
    await client.disconnect();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example();
}

export default FilesystemMCPClient;
