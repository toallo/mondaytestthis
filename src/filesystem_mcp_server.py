#!/usr/bin/env python3
"""
Filesystem MCP Server Implementation (Python)

This server exposes filesystem operations through the Model Context Protocol,
allowing AI assistants and other clients to perform file system operations
in a secure and standardized way.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
import fnmatch


class FilesystemMCPServer:
    """
    MCP Server for filesystem operations.
    Provides secure, sandboxed access to filesystem operations.
    """
    
    def __init__(self, allowed_paths: Optional[List[str]] = None):
        """
        Initialize the filesystem MCP server.
        
        Args:
            allowed_paths: List of paths that are allowed to be accessed.
                          All operations are restricted to these paths.
        """
        if allowed_paths is None:
            allowed_paths = [os.getcwd()]
        
        self.allowed_paths = [os.path.abspath(p) for p in allowed_paths]
        
    def validate_path(self, file_path: str) -> str:
        """
        Validate that a path is within allowed directories.
        
        Args:
            file_path: Path to validate
            
        Returns:
            Absolute path if valid
            
        Raises:
            PermissionError: If path is outside allowed directories
        """
        resolved = os.path.abspath(file_path)
        
        is_allowed = any(
            resolved.startswith(allowed_path) 
            for allowed_path in self.allowed_paths
        )
        
        if not is_allowed:
            raise PermissionError(
                f"Access denied: Path {file_path} is outside allowed directories"
            )
        
        return resolved
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of available tools.
        
        Returns:
            List of tool definitions with schemas
        """
        return [
            {
                "name": "read_file",
                "description": "Read the complete contents of a file from the file system",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file to read"
                        }
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "write_file",
                "description": "Create a new file or overwrite an existing file with content",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file to write"
                        },
                        "content": {
                            "type": "string",
                            "description": "Content to write to the file"
                        }
                    },
                    "required": ["path", "content"]
                }
            },
            {
                "name": "list_directory",
                "description": "List contents of a directory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the directory"
                        },
                        "recursive": {
                            "type": "boolean",
                            "description": "List recursively (default: false)",
                            "default": False
                        }
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "create_directory",
                "description": "Create a new directory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the directory to create"
                        },
                        "recursive": {
                            "type": "boolean",
                            "description": "Create parent directories if needed (default: true)",
                            "default": True
                        }
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "delete_file",
                "description": "Delete a file from the filesystem",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file to delete"
                        }
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "get_file_info",
                "description": "Get detailed information about a file or directory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file or directory"
                        }
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "move_file",
                "description": "Move or rename a file",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "source": {
                            "type": "string",
                            "description": "Source path"
                        },
                        "destination": {
                            "type": "string",
                            "description": "Destination path"
                        }
                    },
                    "required": ["source", "destination"]
                }
            },
            {
                "name": "copy_file",
                "description": "Copy a file to a new location",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "source": {
                            "type": "string",
                            "description": "Source path"
                        },
                        "destination": {
                            "type": "string",
                            "description": "Destination path"
                        }
                    },
                    "required": ["source", "destination"]
                }
            },
            {
                "name": "search_files",
                "description": "Search for files matching a pattern",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Directory to search in"
                        },
                        "pattern": {
                            "type": "string",
                            "description": "Search pattern (supports wildcards)"
                        }
                    },
                    "required": ["path", "pattern"]
                }
            }
        ]
    
    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool by name with given arguments.
        
        Args:
            name: Tool name
            arguments: Tool arguments
            
        Returns:
            Tool execution result
        """
        try:
            if name == "read_file":
                return self.read_file(arguments["path"])
            elif name == "write_file":
                return self.write_file(arguments["path"], arguments["content"])
            elif name == "list_directory":
                return self.list_directory(
                    arguments["path"], 
                    arguments.get("recursive", False)
                )
            elif name == "create_directory":
                return self.create_directory(
                    arguments["path"],
                    arguments.get("recursive", True)
                )
            elif name == "delete_file":
                return self.delete_file(arguments["path"])
            elif name == "get_file_info":
                return self.get_file_info(arguments["path"])
            elif name == "move_file":
                return self.move_file(
                    arguments["source"],
                    arguments["destination"]
                )
            elif name == "copy_file":
                return self.copy_file(
                    arguments["source"],
                    arguments["destination"]
                )
            elif name == "search_files":
                return self.search_files(
                    arguments["path"],
                    arguments["pattern"]
                )
            else:
                return {
                    "content": [{"type": "text", "text": f"Unknown tool: {name}"}],
                    "isError": True
                }
        except Exception as e:
            return {
                "content": [{"type": "text", "text": f"Error: {str(e)}"}],
                "isError": True
            }
    
    def read_file(self, file_path: str) -> Dict[str, Any]:
        """Read file contents."""
        valid_path = self.validate_path(file_path)
        
        with open(valid_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "content": [{"type": "text", "text": content}]
        }
    
    def write_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Write content to a file."""
        valid_path = self.validate_path(file_path)
        
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(valid_path), exist_ok=True)
        
        with open(valid_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {
            "content": [{
                "type": "text",
                "text": f"Successfully wrote {len(content)} characters to {file_path}"
            }]
        }
    
    def list_directory(self, dir_path: str, recursive: bool = False) -> Dict[str, Any]:
        """List directory contents."""
        valid_path = self.validate_path(dir_path)
        
        if recursive:
            files = self._list_directory_recursive(valid_path, valid_path)
        else:
            files = []
            for entry in os.listdir(valid_path):
                full_path = os.path.join(valid_path, entry)
                files.append({
                    "name": entry,
                    "type": "directory" if os.path.isdir(full_path) else "file",
                    "path": os.path.join(dir_path, entry)
                })
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(files, indent=2)
            }]
        }
    
    def _list_directory_recursive(self, dir_path: str, base_path: str) -> List[Dict[str, Any]]:
        """Recursively list directory contents."""
        files = []
        
        for entry in os.listdir(dir_path):
            full_path = os.path.join(dir_path, entry)
            relative_path = os.path.relpath(full_path, base_path)
            
            if os.path.isdir(full_path):
                files.append({
                    "name": entry,
                    "type": "directory",
                    "path": relative_path
                })
                files.extend(self._list_directory_recursive(full_path, base_path))
            else:
                files.append({
                    "name": entry,
                    "type": "file",
                    "path": relative_path
                })
        
        return files
    
    def create_directory(self, dir_path: str, recursive: bool = True) -> Dict[str, Any]:
        """Create a directory."""
        valid_path = self.validate_path(dir_path)
        
        if recursive:
            os.makedirs(valid_path, exist_ok=True)
        else:
            os.mkdir(valid_path)
        
        return {
            "content": [{
                "type": "text",
                "text": f"Successfully created directory: {dir_path}"
            }]
        }
    
    def delete_file(self, file_path: str) -> Dict[str, Any]:
        """Delete a file."""
        valid_path = self.validate_path(file_path)
        os.unlink(valid_path)
        
        return {
            "content": [{
                "type": "text",
                "text": f"Successfully deleted: {file_path}"
            }]
        }
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information."""
        valid_path = self.validate_path(file_path)
        stat = os.stat(valid_path)
        
        info = {
            "path": file_path,
            "size": stat.st_size,
            "isFile": os.path.isfile(valid_path),
            "isDirectory": os.path.isdir(valid_path),
            "created": stat.st_ctime,
            "modified": stat.st_mtime,
            "accessed": stat.st_atime,
            "permissions": oct(stat.st_mode)[-3:]
        }
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(info, indent=2)
            }]
        }
    
    def move_file(self, source: str, destination: str) -> Dict[str, Any]:
        """Move or rename a file."""
        valid_source = self.validate_path(source)
        valid_dest = self.validate_path(destination)
        
        shutil.move(valid_source, valid_dest)
        
        return {
            "content": [{
                "type": "text",
                "text": f"Successfully moved {source} to {destination}"
            }]
        }
    
    def copy_file(self, source: str, destination: str) -> Dict[str, Any]:
        """Copy a file."""
        valid_source = self.validate_path(source)
        valid_dest = self.validate_path(destination)
        
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(valid_dest), exist_ok=True)
        
        shutil.copy2(valid_source, valid_dest)
        
        return {
            "content": [{
                "type": "text",
                "text": f"Successfully copied {source} to {destination}"
            }]
        }
    
    def search_files(self, dir_path: str, pattern: str) -> Dict[str, Any]:
        """Search for files matching a pattern."""
        valid_path = self.validate_path(dir_path)
        
        all_files = self._list_directory_recursive(valid_path, valid_path)
        matches = [
            f for f in all_files 
            if fnmatch.fnmatch(f["name"], pattern)
        ]
        
        return {
            "content": [{
                "type": "text",
                "text": json.dumps(matches, indent=2)
            }]
        }


def main():
    """Main entry point for the MCP server."""
    allowed_paths = sys.argv[1:] if len(sys.argv) > 1 else [os.getcwd()]
    server = FilesystemMCPServer(allowed_paths)
    
    print(f"Filesystem MCP Server initialized", file=sys.stderr)
    print(f"Allowed paths: {server.allowed_paths}", file=sys.stderr)
    print(f"Available tools: {len(server.get_tools())}", file=sys.stderr)


if __name__ == "__main__":
    main()
