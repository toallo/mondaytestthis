#!/usr/bin/env node

/**
 * Interactive Demonstration of Filesystem MCP Tool
 * 
 * This script demonstrates various capabilities of the filesystem MCP tool
 * by performing a series of file operations and showing the results.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

/**
 * Simulated MCP client for demonstration purposes
 * In production, this would use the actual MCP SDK client
 */
class FilesystemMCPClient {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async callTool(toolName, args) {
    logInfo(`Calling tool: ${toolName}`);
    logInfo(`Arguments: ${JSON.stringify(args, null, 2)}`);

    switch (toolName) {
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
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  resolvePath(filePath) {
    return path.resolve(this.basePath, filePath);
  }

  async readFile(filePath) {
    const content = await fs.readFile(this.resolvePath(filePath), 'utf-8');
    return { content, success: true };
  }

  async writeFile(filePath, content) {
    await fs.writeFile(this.resolvePath(filePath), content, 'utf-8');
    return { success: true, message: `Wrote ${content.length} bytes` };
  }

  async listDirectory(dirPath, recursive = false) {
    const fullPath = this.resolvePath(dirPath);
    
    if (recursive) {
      const files = await this.listRecursive(fullPath, fullPath);
      return { files, success: true };
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name),
    }));

    return { files, success: true };
  }

  async listRecursive(dirPath, basePath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        files.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
        });
        const subFiles = await this.listRecursive(fullPath, basePath);
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

  async createDirectory(dirPath, recursive = true) {
    await fs.mkdir(this.resolvePath(dirPath), { recursive });
    return { success: true, message: `Created directory: ${dirPath}` };
  }

  async deleteFile(filePath) {
    await fs.unlink(this.resolvePath(filePath));
    return { success: true, message: `Deleted: ${filePath}` };
  }

  async getFileInfo(filePath) {
    const stats = await fs.stat(this.resolvePath(filePath));
    
    return {
      success: true,
      info: {
        path: filePath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode.toString(8).slice(-3),
      },
    };
  }

  async moveFile(source, destination) {
    await fs.rename(this.resolvePath(source), this.resolvePath(destination));
    return { success: true, message: `Moved ${source} to ${destination}` };
  }

  async copyFile(source, destination) {
    await fs.copyFile(this.resolvePath(source), this.resolvePath(destination));
    return { success: true, message: `Copied ${source} to ${destination}` };
  }

  async searchFiles(dirPath, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    const allFiles = await this.listRecursive(this.resolvePath(dirPath), this.resolvePath(dirPath));
    const matches = allFiles.filter(file => regex.test(file.name));

    return { files: matches, success: true };
  }
}

/**
 * Run the demonstration
 */
async function runDemo() {
  log('\n🚀 Filesystem MCP Tool Demonstration\n', colors.bright + colors.green);
  log('This demo showcases the capabilities of the filesystem MCP tool.', colors.cyan);
  
  const demoPath = path.join(projectRoot, 'examples');
  const client = new FilesystemMCPClient(demoPath);

  try {
    // 1. Create demo directory structure
    logSection('1. Creating Directory Structure');
    await client.callTool('create_directory', {
      path: 'sample-data',
      recursive: true,
    });
    logSuccess('Created directory: examples/sample-data');

    await client.callTool('create_directory', {
      path: 'output',
      recursive: true,
    });
    logSuccess('Created directory: examples/output');

    // 2. Write sample files
    logSection('2. Writing Sample Files');
    
    const sampleData = {
      'config.json': JSON.stringify({
        appName: 'MCP Demo',
        version: '1.0.0',
        features: ['read', 'write', 'list', 'search'],
      }, null, 2),
      'notes.txt': 'This is a sample text file.\nIt demonstrates file reading capabilities.\nFilesystem MCP tools are powerful!',
      'data.csv': 'id,name,value\n1,Item A,100\n2,Item B,200\n3,Item C,150',
    };

    for (const [filename, content] of Object.entries(sampleData)) {
      await client.callTool('write_file', {
        path: `sample-data/${filename}`,
        content,
      });
      logSuccess(`Created file: ${filename}`);
    }

    // 3. Read files
    logSection('3. Reading Files');
    
    const configResult = await client.callTool('read_file', {
      path: 'sample-data/config.json',
    });
    log('\nContent of config.json:', colors.yellow);
    console.log(configResult.content);

    // 4. List directory contents
    logSection('4. Listing Directory Contents');
    
    const listResult = await client.callTool('list_directory', {
      path: 'sample-data',
      recursive: false,
    });
    log('\nFiles in sample-data directory:', colors.yellow);
    listResult.files.forEach(file => {
      console.log(`  ${file.type === 'directory' ? '📁' : '📄'} ${file.name}`);
    });

    // 5. Get file information
    logSection('5. Getting File Information');
    
    const infoResult = await client.callTool('get_file_info', {
      path: 'sample-data/notes.txt',
    });
    log('\nFile information for notes.txt:', colors.yellow);
    console.log(JSON.stringify(infoResult.info, null, 2));

    // 6. Copy file
    logSection('6. Copying Files');
    
    await client.callTool('copy_file', {
      source: 'sample-data/notes.txt',
      destination: 'output/notes-copy.txt',
    });
    logSuccess('Copied notes.txt to output/notes-copy.txt');

    // 7. Search for files
    logSection('7. Searching for Files');
    
    const searchResult = await client.callTool('search_files', {
      path: 'sample-data',
      pattern: '.*\\.json',
    });
    log('\nSearch results for *.json files:', colors.yellow);
    searchResult.files.forEach(file => {
      console.log(`  📄 ${file.path}`);
    });

    // 8. Process and transform data
    logSection('8. Processing Data (Reading CSV, Transforming, Writing)');
    
    const csvResult = await client.callTool('read_file', {
      path: 'sample-data/data.csv',
    });
    
    const lines = csvResult.content.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });

    const processedData = {
      totalItems: data.length,
      totalValue: data.reduce((sum, item) => sum + parseInt(item.value || 0), 0),
      items: data,
    };

    await client.callTool('write_file', {
      path: 'output/processed-data.json',
      content: JSON.stringify(processedData, null, 2),
    });
    logSuccess('Processed CSV data and saved to output/processed-data.json');

    // 9. Create a summary report
    logSection('9. Generating Summary Report');
    
    const summaryReport = `
Filesystem MCP Tool Demo - Summary Report
==========================================

Generated: ${new Date().toISOString()}

Operations Performed:
✓ Created directories
✓ Wrote ${Object.keys(sampleData).length} files
✓ Read file contents
✓ Listed directory contents
✓ Retrieved file metadata
✓ Copied files
✓ Searched for files by pattern
✓ Processed and transformed data

Files Created:
${Object.keys(sampleData).map(f => `  - sample-data/${f}`).join('\n')}
  - output/notes-copy.txt
  - output/processed-data.json

Total Data Processed: ${processedData.totalValue} units
Total Files: ${Object.keys(sampleData).length + 2}

The filesystem MCP tool successfully handled all operations!
`;

    await client.callTool('write_file', {
      path: 'output/summary-report.txt',
      content: summaryReport,
    });
    logSuccess('Generated summary report: output/summary-report.txt');

    // 10. List all files recursively
    logSection('10. Final Directory Structure (Recursive)');
    
    const recursiveList = await client.callTool('list_directory', {
      path: '.',
      recursive: true,
    });
    
    log('\nComplete directory structure:', colors.yellow);
    recursiveList.files.forEach(file => {
      const indent = '  '.repeat((file.path.match(/\//g) || []).length);
      const icon = file.type === 'directory' ? '📁' : '📄';
      console.log(`${indent}${icon} ${file.name}`);
    });

    // Success message
    logSection('✅ Demo Complete!');
    log('\nAll filesystem operations completed successfully!', colors.green);
    log('\nGenerated files can be found in:', colors.cyan);
    log(`  ${path.join(projectRoot, 'examples', 'sample-data')}`, colors.yellow);
    log(`  ${path.join(projectRoot, 'examples', 'output')}`, colors.yellow);
    log('\nYou can inspect these files to see the results.', colors.cyan);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.bright + '\x1b[31m');
    console.error(error);
    process.exit(1);
  }
}

// Run the demo
runDemo();
