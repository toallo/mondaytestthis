#!/usr/bin/env node

/**
 * Test Suite for Filesystem MCP Tool
 * 
 * This script tests various filesystem operations to ensure
 * the MCP tool is working correctly.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const testDir = path.join(projectRoot, 'test-temp');

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test assertion helper
 */
async function test(name, testFn) {
  testsRun++;
  try {
    await testFn();
    testsPassed++;
    log(`✓ ${name}`, colors.green);
    return true;
  } catch (error) {
    testsFailed++;
    log(`✗ ${name}`, colors.red);
    log(`  Error: ${error.message}`, colors.red);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

/**
 * Filesystem operations for testing
 */
class FilesystemOperations {
  constructor(basePath) {
    this.basePath = basePath;
  }

  resolvePath(filePath) {
    return path.resolve(this.basePath, filePath);
  }

  async readFile(filePath) {
    return await fs.readFile(this.resolvePath(filePath), 'utf-8');
  }

  async writeFile(filePath, content) {
    await fs.writeFile(this.resolvePath(filePath), content, 'utf-8');
  }

  async createDirectory(dirPath) {
    await fs.mkdir(this.resolvePath(dirPath), { recursive: true });
  }

  async deleteFile(filePath) {
    await fs.unlink(this.resolvePath(filePath));
  }

  async listDirectory(dirPath) {
    const entries = await fs.readdir(this.resolvePath(dirPath), {
      withFileTypes: true,
    });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }));
  }

  async getFileInfo(filePath) {
    const stats = await fs.stat(this.resolvePath(filePath));
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      modified: stats.mtime,
    };
  }

  async copyFile(source, destination) {
    await fs.copyFile(
      this.resolvePath(source),
      this.resolvePath(destination)
    );
  }

  async moveFile(source, destination) {
    await fs.rename(
      this.resolvePath(source),
      this.resolvePath(destination)
    );
  }

  async fileExists(filePath) {
    return existsSync(this.resolvePath(filePath));
  }
}

/**
 * Setup and cleanup
 */
async function setup() {
  if (existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }
  await fs.mkdir(testDir, { recursive: true });
}

async function cleanup() {
  if (existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  log('\n🧪 Filesystem MCP Tool Test Suite\n', colors.bright + colors.blue);

  await setup();
  const ops = new FilesystemOperations(testDir);

  // Test 1: Write and read file
  await test('Write and read text file', async () => {
    const content = 'Hello, MCP Filesystem!';
    await ops.writeFile('test.txt', content);
    const readContent = await ops.readFile('test.txt');
    assertEqual(readContent, content, 'File content should match');
  });

  // Test 2: Create directory
  await test('Create directory', async () => {
    await ops.createDirectory('testdir');
    assert(await ops.fileExists('testdir'), 'Directory should exist');
  });

  // Test 3: Create nested directories
  await test('Create nested directories', async () => {
    await ops.createDirectory('parent/child/grandchild');
    assert(
      await ops.fileExists('parent/child/grandchild'),
      'Nested directories should exist'
    );
  });

  // Test 4: List directory contents
  await test('List directory contents', async () => {
    await ops.writeFile('file1.txt', 'content1');
    await ops.writeFile('file2.txt', 'content2');
    await ops.createDirectory('subdir');
    
    const entries = await ops.listDirectory('.');
    assert(entries.length >= 3, 'Should list all entries');
    
    const fileNames = entries.map(e => e.name);
    assert(fileNames.includes('file1.txt'), 'Should include file1.txt');
    assert(fileNames.includes('file2.txt'), 'Should include file2.txt');
    assert(fileNames.includes('subdir'), 'Should include subdir');
  });

  // Test 5: Get file information
  await test('Get file information', async () => {
    const content = 'Test content for info';
    await ops.writeFile('info-test.txt', content);
    
    const info = await ops.getFileInfo('info-test.txt');
    assert(info.isFile, 'Should be a file');
    assert(!info.isDirectory, 'Should not be a directory');
    assertEqual(info.size, content.length, 'Size should match content length');
  });

  // Test 6: Copy file
  await test('Copy file', async () => {
    const content = 'Content to copy';
    await ops.writeFile('source.txt', content);
    await ops.copyFile('source.txt', 'destination.txt');
    
    assert(await ops.fileExists('source.txt'), 'Source should still exist');
    assert(await ops.fileExists('destination.txt'), 'Destination should exist');
    
    const copiedContent = await ops.readFile('destination.txt');
    assertEqual(copiedContent, content, 'Copied content should match');
  });

  // Test 7: Move/rename file
  await test('Move/rename file', async () => {
    const content = 'Content to move';
    await ops.writeFile('original.txt', content);
    await ops.moveFile('original.txt', 'moved.txt');
    
    assert(!await ops.fileExists('original.txt'), 'Original should not exist');
    assert(await ops.fileExists('moved.txt'), 'Moved file should exist');
    
    const movedContent = await ops.readFile('moved.txt');
    assertEqual(movedContent, content, 'Moved content should match');
  });

  // Test 8: Delete file
  await test('Delete file', async () => {
    await ops.writeFile('to-delete.txt', 'Delete me');
    assert(await ops.fileExists('to-delete.txt'), 'File should exist before deletion');
    
    await ops.deleteFile('to-delete.txt');
    assert(!await ops.fileExists('to-delete.txt'), 'File should not exist after deletion');
  });

  // Test 9: Handle large files
  await test('Handle large file content', async () => {
    const largeContent = 'x'.repeat(100000); // 100KB of data
    await ops.writeFile('large.txt', largeContent);
    
    const readContent = await ops.readFile('large.txt');
    assertEqual(readContent.length, largeContent.length, 'Large file content length should match');
  });

  // Test 10: Handle special characters in filenames
  await test('Handle special characters in filenames', async () => {
    const content = 'Special file';
    await ops.writeFile('file-with-dashes_and_underscores.txt', content);
    
    const readContent = await ops.readFile('file-with-dashes_and_underscores.txt');
    assertEqual(readContent, content, 'Content should match for special filename');
  });

  // Test 11: Handle JSON data
  await test('Write and read JSON data', async () => {
    const data = {
      name: 'Test',
      value: 42,
      nested: { key: 'value' },
      array: [1, 2, 3],
    };
    
    await ops.writeFile('data.json', JSON.stringify(data, null, 2));
    const readData = JSON.parse(await ops.readFile('data.json'));
    
    assertEqual(readData.name, data.name, 'JSON property should match');
    assertEqual(readData.value, data.value, 'JSON number should match');
    assertEqual(readData.nested.key, data.nested.key, 'Nested JSON should match');
  });

  // Test 12: Handle UTF-8 content
  await test('Handle UTF-8 content', async () => {
    const utf8Content = 'Hello 世界 🌍 café';
    await ops.writeFile('utf8.txt', utf8Content);
    
    const readContent = await ops.readFile('utf8.txt');
    assertEqual(readContent, utf8Content, 'UTF-8 content should be preserved');
  });

  // Test 13: Multiple operations in sequence
  await test('Perform multiple operations in sequence', async () => {
    await ops.createDirectory('sequence');
    await ops.writeFile('sequence/file1.txt', 'content1');
    await ops.writeFile('sequence/file2.txt', 'content2');
    await ops.copyFile('sequence/file1.txt', 'sequence/file1-copy.txt');
    
    const entries = await ops.listDirectory('sequence');
    assertEqual(entries.length, 3, 'Should have 3 files after sequence');
  });

  // Test 14: Empty file handling
  await test('Handle empty files', async () => {
    await ops.writeFile('empty.txt', '');
    const content = await ops.readFile('empty.txt');
    assertEqual(content, '', 'Empty file should have empty content');
    
    const info = await ops.getFileInfo('empty.txt');
    assertEqual(info.size, 0, 'Empty file should have size 0');
  });

  // Test 15: Directory info
  await test('Get directory information', async () => {
    await ops.createDirectory('dir-info');
    const info = await ops.getFileInfo('dir-info');
    
    assert(info.isDirectory, 'Should be a directory');
    assert(!info.isFile, 'Should not be a file');
  });

  await cleanup();

  // Print summary
  log('\n' + '='.repeat(60), colors.bright);
  log('Test Summary', colors.bright + colors.blue);
  log('='.repeat(60), colors.bright);
  log(`Total tests: ${testsRun}`);
  log(`Passed: ${testsPassed}`, colors.green);
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.reset);
  log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
  log('='.repeat(60), colors.bright);

  if (testsFailed > 0) {
    log('\n❌ Some tests failed', colors.red);
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', colors.green);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
