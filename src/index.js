#!/usr/bin/env node

/**
 * Filesystem MCP Server Implementation
 * 
 * This server exposes filesystem operations through the Model Context Protocol,
 * allowing AI assistants and other clients to perform file system operations
 * in a secure and standardized way.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

class FilesystemMCPServer {
  constructor(allowedPaths = [process.cwd()]) {
    this.allowedPaths = allowedPaths.map(p => path.resolve(p));
    this.server = new Server(
      {
        name: 'filesystem-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Validate that a path is within allowed directories
   */
  validatePath(filePath) {
    const resolved = path.resolve(filePath);
    const isAllowed = this.allowedPaths.some(allowedPath =>
      resolved.startsWith(allowedPath)
    );

    if (!isAllowed) {
      throw new Error(`Access denied: Path ${filePath} is outside allowed directories`);
    }

    return resolved;
  }

  /**
   * Setup request handlers for the MCP server
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'read_file',
          description: 'Read the complete contents of a file from the file system',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to read',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Create a new file or overwrite an existing file with content',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to write',
              },
              content: {
                type: 'string',
                description: 'Content to write to the file',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'list_directory',
          description: 'List contents of a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the directory',
              },
              recursive: {
                type: 'boolean',
                description: 'List recursively (default: false)',
                default: false,
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'create_directory',
          description: 'Create a new directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the directory to create',
              },
              recursive: {
                type: 'boolean',
                description: 'Create parent directories if needed (default: true)',
                default: true,
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'delete_file',
          description: 'Delete a file from the filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to delete',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'get_file_info',
          description: 'Get detailed information about a file or directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file or directory',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'move_file',
          description: 'Move or rename a file',
          inputSchema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description: 'Source path',
              },
              destination: {
                type: 'string',
                description: 'Destination path',
              },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'copy_file',
          description: 'Copy a file to a new location',
          inputSchema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description: 'Source path',
              },
              destination: {
                type: 'string',
                description: 'Destination path',
              },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'search_files',
          description: 'Search for files matching a pattern',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory to search in',
              },
              pattern: {
                type: 'string',
                description: 'Search pattern (supports wildcards)',
              },
            },
            required: ['path', 'pattern'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args.path);
          case 'write_file':
            return await this.writeFile(args.path, args.content);
          case 'list_directory':
            return await this.listDirectory(args.path, args.recursive);
          case 'create_directory':
            return await this.createDirectory(args.path, args.recursive);
          case 'delete_file':
            return await this.deleteFile(args.path);
          case 'get_file_info':
            return await this.getFileInfo(args.path);
          case 'move_file':
            return await this.moveFile(args.source, args.destination);
          case 'copy_file':
            return await this.copyFile(args.source, args.destination);
          case 'search_files':
            return await this.searchFiles(args.path, args.pattern);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Read file contents
   */
  async readFile(filePath) {
    const validPath = this.validatePath(filePath);
    const content = await fs.readFile(validPath, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath, content) {
    const validPath = this.validatePath(filePath);
    await fs.writeFile(validPath, content, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully wrote ${content.length} characters to ${filePath}`,
        },
      ],
    };
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath, recursive = false) {
    const validPath = this.validatePath(dirPath);
    
    if (recursive) {
      const files = await this.listDirectoryRecursive(validPath);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    }

    const entries = await fs.readdir(validPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name),
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(files, null, 2),
        },
      ],
    };
  }

  /**
   * Recursively list directory contents
   */
  async listDirectoryRecursive(dirPath, relativeTo = dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(relativeTo, fullPath);

      if (entry.isDirectory()) {
        files.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
        });
        const subFiles = await this.listDirectoryRecursive(fullPath, relativeTo);
        files.push(...subFiles);
      } else {
        files.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
        });
      }
    }

    return files;
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath, recursive = true) {
    const validPath = this.validatePath(dirPath);
    await fs.mkdir(validPath, { recursive });
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully created directory: ${dirPath}`,
        },
      ],
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    const validPath = this.validatePath(filePath);
    await fs.unlink(validPath);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully deleted: ${filePath}`,
        },
      ],
    };
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    const validPath = this.validatePath(filePath);
    const stats = await fs.stat(validPath);
    
    const info = {
      path: filePath,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      permissions: stats.mode.toString(8).slice(-3),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  /**
   * Move or rename a file
   */
  async moveFile(source, destination) {
    const validSource = this.validatePath(source);
    const validDest = this.validatePath(destination);
    await fs.rename(validSource, validDest);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved ${source} to ${destination}`,
        },
      ],
    };
  }

  /**
   * Copy a file
   */
  async copyFile(source, destination) {
    const validSource = this.validatePath(source);
    const validDest = this.validatePath(destination);
    await fs.copyFile(validSource, validDest);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully copied ${source} to ${destination}`,
        },
      ],
    };
  }

  /**
   * Search for files matching a pattern
   */
  async searchFiles(dirPath, pattern) {
    const validPath = this.validatePath(dirPath);
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    
    const allFiles = await this.listDirectoryRecursive(validPath);
    const matches = allFiles.filter(file => regex.test(file.name));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(matches, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Filesystem MCP Server running on stdio');
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const allowedPaths = process.argv.slice(2);
  const server = new FilesystemMCPServer(
    allowedPaths.length > 0 ? allowedPaths : [process.cwd()]
  );
  server.start().catch(console.error);
}

export default FilesystemMCPServer;
