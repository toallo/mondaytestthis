# Filesystem MCP Tool - Python Implementation

This is the Python implementation of the Filesystem MCP tool, providing full filesystem operation capabilities through the Model Context Protocol.

## Features

✅ **Fully Functional** - Works immediately without additional dependencies  
✅ **Secure** - Path validation and sandboxing built-in  
✅ **Tested** - 18 comprehensive tests with 100% pass rate  
✅ **Rich Demo** - Interactive demonstration with colorized output  
✅ **Well Documented** - Complete API documentation and examples

## Quick Start

### Run the Demo

```bash
python3 src/demo.py
```

### Run the Tests

```bash
python3 src/test_filesystem.py
```

### Use in Your Code

```python
from filesystem_mcp_server import FilesystemMCPServer

# Initialize with allowed paths
server = FilesystemMCPServer(['/path/to/workspace'])

# Read a file
result = server.call_tool('read_file', {'path': 'config.json'})
content = result['content'][0]['text']
print(content)

# Write a file
result = server.call_tool('write_file', {
    'path': 'output.txt',
    'content': 'Hello, MCP!'
})

# List directory
result = server.call_tool('list_directory', {
    'path': '.',
    'recursive': False
})
files = json.loads(result['content'][0]['text'])

# Search for files
result = server.call_tool('search_files', {
    'path': '.',
    'pattern': '*.py'
})
matches = json.loads(result['content'][0]['text'])
```

## Available Operations

The filesystem MCP tool provides 9 core operations:

### 1. read_file
Read the complete contents of a file.

```python
result = server.call_tool('read_file', {
    'path': 'myfile.txt'
})
```

### 2. write_file
Create or overwrite a file with content.

```python
result = server.call_tool('write_file', {
    'path': 'output.txt',
    'content': 'File contents here'
})
```

### 3. list_directory
List contents of a directory (with optional recursion).

```python
result = server.call_tool('list_directory', {
    'path': '/my/directory',
    'recursive': True  # Optional
})
```

### 4. create_directory
Create a new directory (with optional parent creation).

```python
result = server.call_tool('create_directory', {
    'path': 'new/nested/directory',
    'recursive': True  # Optional, default True
})
```

### 5. delete_file
Delete a file from the filesystem.

```python
result = server.call_tool('delete_file', {
    'path': 'unwanted.txt'
})
```

### 6. get_file_info
Get detailed metadata about a file or directory.

```python
result = server.call_tool('get_file_info', {
    'path': 'myfile.txt'
})
info = json.loads(result['content'][0]['text'])
# Returns: size, isFile, isDirectory, created, modified, accessed, permissions
```

### 7. move_file
Move or rename a file.

```python
result = server.call_tool('move_file', {
    'source': 'old-name.txt',
    'destination': 'new-name.txt'
})
```

### 8. copy_file
Copy a file to a new location.

```python
result = server.call_tool('copy_file', {
    'source': 'original.txt',
    'destination': 'copy.txt'
})
```

### 9. search_files
Search for files matching a pattern (supports wildcards).

```python
result = server.call_tool('search_files', {
    'path': '/my/directory',
    'pattern': '*.json'
})
```

## Demo Output

When you run `python3 src/demo.py`, you'll see:

```
🚀 Filesystem MCP Tool Demonstration

This demo showcases the capabilities of the filesystem MCP tool.

============================================================
1. Creating Directory Structure
============================================================
✓ Created directory: examples/sample-data
✓ Created directory: examples/output

============================================================
2. Writing Sample Files
============================================================
✓ Created file: config.json
✓ Created file: notes.txt
✓ Created file: data.csv

... (and much more)
```

The demo creates:
- Sample data files (JSON, text, CSV)
- Processed output files
- A comprehensive summary report

## Test Results

Running `python3 src/test_filesystem.py` produces:

```
🧪 Filesystem MCP Tool Test Suite

✓ Write and read text file
✓ Create directory
✓ Create nested directories
✓ List directory contents
✓ Get file information
✓ Copy file
✓ Move/rename file
✓ Delete file
✓ Handle large file content
✓ Handle special characters in filenames
✓ Write and read JSON data
✓ Handle UTF-8 content
✓ Perform multiple operations in sequence
✓ Handle empty files
✓ Get directory information
✓ Search for files
✓ Path validation (security)
✓ Recursive directory listing

============================================================
Test Summary
============================================================
Total tests: 18
Passed: 18
Failed: 0
Success rate: 100.0%

✅ All tests passed!
```

## Security Features

### Path Validation

All paths are validated to ensure they're within allowed directories:

```python
def validate_path(self, file_path: str) -> str:
    resolved = os.path.abspath(file_path)
    is_allowed = any(
        resolved.startswith(allowed_path) 
        for allowed_path in self.allowed_paths
    )
    if not is_allowed:
        raise PermissionError("Access denied")
    return resolved
```

### Sandboxing

The server is initialized with specific allowed paths:

```python
# Only allow access to specific directories
server = FilesystemMCPServer([
    '/home/user/projects',
    '/home/user/documents'
])
```

Any attempt to access files outside these paths will be rejected.

## Real-World Examples

### Configuration Manager

```python
import json
from filesystem_mcp_server import FilesystemMCPServer

def update_config(config_path, updates):
    server = FilesystemMCPServer([os.path.dirname(config_path)])
    
    # Read config
    result = server.call_tool('read_file', {'path': config_path})
    config = json.loads(result['content'][0]['text'])
    
    # Update
    config.update(updates)
    
    # Write back
    server.call_tool('write_file', {
        'path': config_path,
        'content': json.dumps(config, indent=2)
    })
```

### Log Analyzer

```python
def analyze_logs(log_path):
    server = FilesystemMCPServer([os.path.dirname(log_path)])
    
    # Read logs
    result = server.call_tool('read_file', {'path': log_path})
    logs = result['content'][0]['text']
    
    # Analyze
    lines = logs.split('\n')
    errors = [l for l in lines if 'ERROR' in l]
    warnings = [l for l in lines if 'WARN' in l]
    
    # Generate report
    report = f"""
    Log Analysis
    Total Lines: {len(lines)}
    Errors: {len(errors)}
    Warnings: {len(warnings)}
    """
    
    server.call_tool('write_file', {
        'path': 'log-analysis.txt',
        'content': report
    })
```

### Batch File Processor

```python
def process_files(input_dir, output_dir, processor_fn):
    server = FilesystemMCPServer([input_dir, output_dir])
    
    # Find all text files
    result = server.call_tool('search_files', {
        'path': input_dir,
        'pattern': '*.txt'
    })
    files = json.loads(result['content'][0]['text'])
    
    # Process each file
    for file in files:
        # Read
        result = server.call_tool('read_file', {'path': file['path']})
        content = result['content'][0]['text']
        
        # Process
        processed = processor_fn(content)
        
        # Write
        output_path = os.path.join(output_dir, file['name'])
        server.call_tool('write_file', {
            'path': output_path,
            'content': processed
        })
```

## Requirements

- Python 3.6 or higher
- Standard library only (no external dependencies)

## License

This is a demonstration project for the Model Context Protocol filesystem tool capabilities.

## Learn More

- [Main README](./README.md) - Full project overview
- [Architecture Documentation](./ARCHITECTURE.md) - Technical details
- [Usage Guide](./USAGE_GUIDE.md) - Comprehensive guide
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
