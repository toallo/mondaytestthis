#!/usr/bin/env python3
"""
Test Suite for Filesystem MCP Tool

This script tests various filesystem operations to ensure
the MCP tool is working correctly.
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add parent directory to path to import server
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from filesystem_mcp_server import FilesystemMCPServer


# ANSI colors
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    BRIGHT = '\033[1m'


# Test results tracking
tests_run = 0
tests_passed = 0
tests_failed = 0


def log(message, color=Colors.RESET):
    """Print colored log message."""
    print(f"{color}{message}{Colors.RESET}")


def test(name, test_fn):
    """Run a test and track results."""
    global tests_run, tests_passed, tests_failed
    tests_run += 1
    
    try:
        test_fn()
        tests_passed += 1
        log(f"✓ {name}", Colors.GREEN)
        return True
    except Exception as error:
        tests_failed += 1
        log(f"✗ {name}", Colors.RED)
        log(f"  Error: {str(error)}", Colors.RED)
        return False


def assert_equal(actual, expected, message=""):
    """Assert that two values are equal."""
    if actual != expected:
        raise AssertionError(
            message or f"Expected {expected}, but got {actual}"
        )


def assert_true(condition, message="Assertion failed"):
    """Assert that condition is true."""
    if not condition:
        raise AssertionError(message)


def run_tests():
    """Run all tests."""
    log('\n🧪 Filesystem MCP Tool Test Suite\n', Colors.BRIGHT + Colors.BLUE)
    
    # Create temporary test directory
    test_dir = tempfile.mkdtemp(prefix='mcp_test_')
    
    try:
        server = FilesystemMCPServer([test_dir])
        
        # Test 1: Write and read text file
        def test_write_read():
            content = "Hello, MCP Filesystem!"
            path = os.path.join(test_dir, 'test.txt')
            
            result = server.call_tool('write_file', {
                'path': path,
                'content': content
            })
            assert_true('isError' not in result, "Write should not error")
            
            result = server.call_tool('read_file', {'path': path})
            read_content = result['content'][0]['text']
            assert_equal(read_content, content, "File content should match")
        
        test('Write and read text file', test_write_read)
        
        # Test 2: Create directory
        def test_create_dir():
            path = os.path.join(test_dir, 'testdir')
            result = server.call_tool('create_directory', {'path': path})
            assert_true(os.path.exists(path), "Directory should exist")
            assert_true(os.path.isdir(path), "Path should be a directory")
        
        test('Create directory', test_create_dir)
        
        # Test 3: Create nested directories
        def test_nested_dirs():
            path = os.path.join(test_dir, 'parent', 'child', 'grandchild')
            result = server.call_tool('create_directory', {'path': path, 'recursive': True})
            assert_true(os.path.exists(path), "Nested directories should exist")
        
        test('Create nested directories', test_nested_dirs)
        
        # Test 4: List directory contents
        def test_list_dir():
            # Create test files
            os.makedirs(os.path.join(test_dir, 'listtest'), exist_ok=True)
            open(os.path.join(test_dir, 'listtest', 'file1.txt'), 'w').close()
            open(os.path.join(test_dir, 'listtest', 'file2.txt'), 'w').close()
            os.makedirs(os.path.join(test_dir, 'listtest', 'subdir'), exist_ok=True)
            
            result = server.call_tool('list_directory', {
                'path': os.path.join(test_dir, 'listtest'),
                'recursive': False
            })
            
            import json
            files = json.loads(result['content'][0]['text'])
            assert_true(len(files) >= 3, "Should list all entries")
            
            file_names = [f['name'] for f in files]
            assert_true('file1.txt' in file_names, "Should include file1.txt")
            assert_true('file2.txt' in file_names, "Should include file2.txt")
            assert_true('subdir' in file_names, "Should include subdir")
        
        test('List directory contents', test_list_dir)
        
        # Test 5: Get file information
        def test_file_info():
            content = "Test content for info"
            path = os.path.join(test_dir, 'info-test.txt')
            
            server.call_tool('write_file', {'path': path, 'content': content})
            result = server.call_tool('get_file_info', {'path': path})
            
            import json
            info = json.loads(result['content'][0]['text'])
            
            assert_true(info['isFile'], "Should be a file")
            assert_true(not info['isDirectory'], "Should not be a directory")
            assert_equal(info['size'], len(content), "Size should match content length")
        
        test('Get file information', test_file_info)
        
        # Test 6: Copy file
        def test_copy():
            content = "Content to copy"
            source = os.path.join(test_dir, 'source.txt')
            dest = os.path.join(test_dir, 'destination.txt')
            
            server.call_tool('write_file', {'path': source, 'content': content})
            server.call_tool('copy_file', {'source': source, 'destination': dest})
            
            assert_true(os.path.exists(source), "Source should still exist")
            assert_true(os.path.exists(dest), "Destination should exist")
            
            result = server.call_tool('read_file', {'path': dest})
            copied_content = result['content'][0]['text']
            assert_equal(copied_content, content, "Copied content should match")
        
        test('Copy file', test_copy)
        
        # Test 7: Move/rename file
        def test_move():
            content = "Content to move"
            original = os.path.join(test_dir, 'original.txt')
            moved = os.path.join(test_dir, 'moved.txt')
            
            server.call_tool('write_file', {'path': original, 'content': content})
            server.call_tool('move_file', {'source': original, 'destination': moved})
            
            assert_true(not os.path.exists(original), "Original should not exist")
            assert_true(os.path.exists(moved), "Moved file should exist")
            
            result = server.call_tool('read_file', {'path': moved})
            moved_content = result['content'][0]['text']
            assert_equal(moved_content, content, "Moved content should match")
        
        test('Move/rename file', test_move)
        
        # Test 8: Delete file
        def test_delete():
            path = os.path.join(test_dir, 'to-delete.txt')
            server.call_tool('write_file', {'path': path, 'content': 'Delete me'})
            
            assert_true(os.path.exists(path), "File should exist before deletion")
            
            server.call_tool('delete_file', {'path': path})
            assert_true(not os.path.exists(path), "File should not exist after deletion")
        
        test('Delete file', test_delete)
        
        # Test 9: Handle large files
        def test_large_file():
            large_content = 'x' * 100000  # 100KB of data
            path = os.path.join(test_dir, 'large.txt')
            
            server.call_tool('write_file', {'path': path, 'content': large_content})
            result = server.call_tool('read_file', {'path': path})
            read_content = result['content'][0]['text']
            
            assert_equal(len(read_content), len(large_content), 
                        "Large file content length should match")
        
        test('Handle large file content', test_large_file)
        
        # Test 10: Handle special characters in filenames
        def test_special_chars():
            content = "Special file"
            path = os.path.join(test_dir, 'file-with-dashes_and_underscores.txt')
            
            server.call_tool('write_file', {'path': path, 'content': content})
            result = server.call_tool('read_file', {'path': path})
            read_content = result['content'][0]['text']
            
            assert_equal(read_content, content, "Content should match for special filename")
        
        test('Handle special characters in filenames', test_special_chars)
        
        # Test 11: Handle JSON data
        def test_json():
            import json
            data = {
                'name': 'Test',
                'value': 42,
                'nested': {'key': 'value'},
                'array': [1, 2, 3]
            }
            
            path = os.path.join(test_dir, 'data.json')
            server.call_tool('write_file', {
                'path': path,
                'content': json.dumps(data, indent=2)
            })
            
            result = server.call_tool('read_file', {'path': path})
            read_data = json.loads(result['content'][0]['text'])
            
            assert_equal(read_data['name'], data['name'], "JSON property should match")
            assert_equal(read_data['value'], data['value'], "JSON number should match")
            assert_equal(read_data['nested']['key'], data['nested']['key'], 
                        "Nested JSON should match")
        
        test('Write and read JSON data', test_json)
        
        # Test 12: Handle UTF-8 content
        def test_utf8():
            utf8_content = "Hello 世界 🌍 café"
            path = os.path.join(test_dir, 'utf8.txt')
            
            server.call_tool('write_file', {'path': path, 'content': utf8_content})
            result = server.call_tool('read_file', {'path': path})
            read_content = result['content'][0]['text']
            
            assert_equal(read_content, utf8_content, "UTF-8 content should be preserved")
        
        test('Handle UTF-8 content', test_utf8)
        
        # Test 13: Multiple operations in sequence
        def test_sequence():
            seq_dir = os.path.join(test_dir, 'sequence')
            server.call_tool('create_directory', {'path': seq_dir})
            
            server.call_tool('write_file', {
                'path': os.path.join(seq_dir, 'file1.txt'),
                'content': 'content1'
            })
            server.call_tool('write_file', {
                'path': os.path.join(seq_dir, 'file2.txt'),
                'content': 'content2'
            })
            server.call_tool('copy_file', {
                'source': os.path.join(seq_dir, 'file1.txt'),
                'destination': os.path.join(seq_dir, 'file1-copy.txt')
            })
            
            result = server.call_tool('list_directory', {'path': seq_dir})
            import json
            files = json.loads(result['content'][0]['text'])
            assert_equal(len(files), 3, "Should have 3 files after sequence")
        
        test('Perform multiple operations in sequence', test_sequence)
        
        # Test 14: Empty file handling
        def test_empty_file():
            path = os.path.join(test_dir, 'empty.txt')
            server.call_tool('write_file', {'path': path, 'content': ''})
            
            result = server.call_tool('read_file', {'path': path})
            content = result['content'][0]['text']
            assert_equal(content, '', "Empty file should have empty content")
            
            result = server.call_tool('get_file_info', {'path': path})
            import json
            info = json.loads(result['content'][0]['text'])
            assert_equal(info['size'], 0, "Empty file should have size 0")
        
        test('Handle empty files', test_empty_file)
        
        # Test 15: Directory info
        def test_dir_info():
            path = os.path.join(test_dir, 'dir-info')
            server.call_tool('create_directory', {'path': path})
            
            result = server.call_tool('get_file_info', {'path': path})
            import json
            info = json.loads(result['content'][0]['text'])
            
            assert_true(info['isDirectory'], "Should be a directory")
            assert_true(not info['isFile'], "Should not be a file")
        
        test('Get directory information', test_dir_info)
        
        # Test 16: Search files
        def test_search():
            search_dir = os.path.join(test_dir, 'search')
            server.call_tool('create_directory', {'path': search_dir})
            
            server.call_tool('write_file', {
                'path': os.path.join(search_dir, 'test1.txt'),
                'content': 'test'
            })
            server.call_tool('write_file', {
                'path': os.path.join(search_dir, 'test2.json'),
                'content': '{}'
            })
            server.call_tool('write_file', {
                'path': os.path.join(search_dir, 'data.txt'),
                'content': 'data'
            })
            
            result = server.call_tool('search_files', {
                'path': search_dir,
                'pattern': '*.txt'
            })
            
            import json
            matches = json.loads(result['content'][0]['text'])
            assert_equal(len(matches), 2, "Should find 2 .txt files")
        
        test('Search for files', test_search)
        
        # Test 17: Path validation (security test)
        def test_path_validation():
            # Try to access outside allowed paths
            result = server.call_tool('read_file', {
                'path': '/etc/passwd'
            })
            
            assert_true('isError' in result, "Should error on unauthorized path")
            assert_true('Access denied' in result['content'][0]['text'], 
                       "Should return access denied error")
        
        test('Path validation (security)', test_path_validation)
        
        # Test 18: Recursive directory listing
        def test_recursive_list():
            rec_dir = os.path.join(test_dir, 'recursive')
            os.makedirs(os.path.join(rec_dir, 'sub1', 'sub2'), exist_ok=True)
            open(os.path.join(rec_dir, 'file1.txt'), 'w').close()
            open(os.path.join(rec_dir, 'sub1', 'file2.txt'), 'w').close()
            open(os.path.join(rec_dir, 'sub1', 'sub2', 'file3.txt'), 'w').close()
            
            result = server.call_tool('list_directory', {
                'path': rec_dir,
                'recursive': True
            })
            
            import json
            files = json.loads(result['content'][0]['text'])
            
            # Should have 3 files + 2 directories
            assert_true(len(files) >= 5, "Should list all files recursively")
        
        test('Recursive directory listing', test_recursive_list)
        
    finally:
        # Cleanup
        shutil.rmtree(test_dir, ignore_errors=True)
    
    # Print summary
    log('\n' + '=' * 60, Colors.BRIGHT)
    log('Test Summary', Colors.BRIGHT + Colors.BLUE)
    log('=' * 60, Colors.BRIGHT)
    print(f"Total tests: {tests_run}")
    log(f"Passed: {tests_passed}", Colors.GREEN)
    log(f"Failed: {tests_failed}", Colors.RED if tests_failed > 0 else Colors.RESET)
    print(f"Success rate: {(tests_passed / tests_run * 100):.1f}%")
    log('=' * 60, Colors.BRIGHT)
    
    if tests_failed > 0:
        log('\n❌ Some tests failed', Colors.RED)
        sys.exit(1)
    else:
        log('\n✅ All tests passed!', Colors.GREEN)


if __name__ == '__main__':
    run_tests()
