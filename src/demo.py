#!/usr/bin/env python3
"""
Interactive Demonstration of Filesystem MCP Tool

This script demonstrates various capabilities of the filesystem MCP tool
by performing a series of file operations and showing the results.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import server
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from filesystem_mcp_server import FilesystemMCPServer


# ANSI color codes
class Colors:
    RESET = '\033[0m'
    BRIGHT = '\033[1m'
    GREEN = '\033[32m'
    BLUE = '\033[34m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    RED = '\033[31m'


def log(message, color=Colors.RESET):
    """Print colored log message."""
    print(f"{color}{message}{Colors.RESET}")


def log_section(title):
    """Print section header."""
    print('\n' + '=' * 60)
    log(title, Colors.BRIGHT + Colors.BLUE)
    print('=' * 60)


def log_success(message):
    """Print success message."""
    log(f"✓ {message}", Colors.GREEN)


def log_info(message):
    """Print info message."""
    log(f"ℹ {message}", Colors.CYAN)


def run_demo():
    """Run the filesystem MCP tool demonstration."""
    log('\n🚀 Filesystem MCP Tool Demonstration\n', Colors.BRIGHT + Colors.GREEN)
    log('This demo showcases the capabilities of the filesystem MCP tool.', Colors.CYAN)
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    demo_path = project_root / 'examples'
    
    # Initialize MCP server
    server = FilesystemMCPServer([str(demo_path)])
    
    try:
        # 1. Create demo directory structure
        log_section('1. Creating Directory Structure')
        
        result = server.call_tool('create_directory', {
            'path': str(demo_path / 'sample-data')
        })
        log_success('Created directory: examples/sample-data')
        
        result = server.call_tool('create_directory', {
            'path': str(demo_path / 'output')
        })
        log_success('Created directory: examples/output')
        
        # 2. Write sample files
        log_section('2. Writing Sample Files')
        
        sample_data = {
            'config.json': json.dumps({
                'appName': 'MCP Demo',
                'version': '1.0.0',
                'features': ['read', 'write', 'list', 'search']
            }, indent=2),
            'notes.txt': 'This is a sample text file.\nIt demonstrates file reading capabilities.\nFilesystem MCP tools are powerful!',
            'data.csv': 'id,name,value\n1,Item A,100\n2,Item B,200\n3,Item C,150'
        }
        
        for filename, content in sample_data.items():
            result = server.call_tool('write_file', {
                'path': str(demo_path / 'sample-data' / filename),
                'content': content
            })
            log_success(f"Created file: {filename}")
        
        # 3. Read files
        log_section('3. Reading Files')
        
        result = server.call_tool('read_file', {
            'path': str(demo_path / 'sample-data' / 'config.json')
        })
        log('\nContent of config.json:', Colors.YELLOW)
        print(result['content'][0]['text'])
        
        # 4. List directory contents
        log_section('4. Listing Directory Contents')
        
        result = server.call_tool('list_directory', {
            'path': str(demo_path / 'sample-data'),
            'recursive': False
        })
        log('\nFiles in sample-data directory:', Colors.YELLOW)
        files = json.loads(result['content'][0]['text'])
        for file in files:
            icon = '📁' if file['type'] == 'directory' else '📄'
            print(f"  {icon} {file['name']}")
        
        # 5. Get file information
        log_section('5. Getting File Information')
        
        result = server.call_tool('get_file_info', {
            'path': str(demo_path / 'sample-data' / 'notes.txt')
        })
        log('\nFile information for notes.txt:', Colors.YELLOW)
        print(result['content'][0]['text'])
        
        # 6. Copy file
        log_section('6. Copying Files')
        
        result = server.call_tool('copy_file', {
            'source': str(demo_path / 'sample-data' / 'notes.txt'),
            'destination': str(demo_path / 'output' / 'notes-copy.txt')
        })
        log_success('Copied notes.txt to output/notes-copy.txt')
        
        # 7. Search for files
        log_section('7. Searching for Files')
        
        result = server.call_tool('search_files', {
            'path': str(demo_path / 'sample-data'),
            'pattern': '*.json'
        })
        log('\nSearch results for *.json files:', Colors.YELLOW)
        matches = json.loads(result['content'][0]['text'])
        for file in matches:
            print(f"  📄 {file['path']}")
        
        # 8. Process and transform data
        log_section('8. Processing Data (Reading CSV, Transforming, Writing)')
        
        result = server.call_tool('read_file', {
            'path': str(demo_path / 'sample-data' / 'data.csv')
        })
        csv_content = result['content'][0]['text']
        
        lines = csv_content.strip().split('\n')
        headers = lines[0].split(',')
        data = []
        
        for line in lines[1:]:
            values = line.split(',')
            row = {headers[i]: values[i] for i in range(len(headers))}
            data.append(row)
        
        processed_data = {
            'totalItems': len(data),
            'totalValue': sum(int(item['value']) for item in data),
            'items': data
        }
        
        result = server.call_tool('write_file', {
            'path': str(demo_path / 'output' / 'processed-data.json'),
            'content': json.dumps(processed_data, indent=2)
        })
        log_success('Processed CSV data and saved to output/processed-data.json')
        
        # 9. Create a summary report
        log_section('9. Generating Summary Report')
        
        summary_report = f"""
Filesystem MCP Tool Demo - Summary Report
==========================================

Generated: {datetime.now().isoformat()}

Operations Performed:
✓ Created directories
✓ Wrote {len(sample_data)} files
✓ Read file contents
✓ Listed directory contents
✓ Retrieved file metadata
✓ Copied files
✓ Searched for files by pattern
✓ Processed and transformed data

Files Created:
{chr(10).join(f'  - sample-data/{f}' for f in sample_data.keys())}
  - output/notes-copy.txt
  - output/processed-data.json

Total Data Processed: {processed_data['totalValue']} units
Total Files: {len(sample_data) + 2}

The filesystem MCP tool successfully handled all operations!
"""
        
        result = server.call_tool('write_file', {
            'path': str(demo_path / 'output' / 'summary-report.txt'),
            'content': summary_report.strip()
        })
        log_success('Generated summary report: output/summary-report.txt')
        
        # 10. List all files recursively
        log_section('10. Final Directory Structure (Recursive)')
        
        result = server.call_tool('list_directory', {
            'path': str(demo_path),
            'recursive': True
        })
        
        log('\nComplete directory structure:', Colors.YELLOW)
        files = json.loads(result['content'][0]['text'])
        for file in files:
            depth = file['path'].count(os.sep)
            indent = '  ' * depth
            icon = '📁' if file['type'] == 'directory' else '📄'
            print(f"{indent}{icon} {file['name']}")
        
        # Success message
        log_section('✅ Demo Complete!')
        log('\nAll filesystem operations completed successfully!', Colors.GREEN)
        log('\nGenerated files can be found in:', Colors.CYAN)
        log(f"  {demo_path / 'sample-data'}", Colors.YELLOW)
        log(f"  {demo_path / 'output'}", Colors.YELLOW)
        log('\nYou can inspect these files to see the results.', Colors.CYAN)
        
    except Exception as error:
        log(f'\n❌ Error: {str(error)}', Colors.BRIGHT + Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    run_demo()
