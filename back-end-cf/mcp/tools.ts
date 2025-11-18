/**
 * @fileoverview MCP Tools for FODI OneDrive operations
 * @module src/mcp/tools
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { listFiles, searchFiles, getFileInfo, getDownloadUrl } from '../services/fileMethods';
import { parsePath } from '../services/pathUtils';

export function handleMcpTools(server: McpServer): void {
  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_files',
        description: 'List files and folders in a OneDrive directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path to list (default: root)',
              default: '/',
            },
          },
        },
      },
      {
        name: 'search_files',
        description: 'Search for files in OneDrive',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Get detailed information about a specific file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_download_url',
        description: 'Get download URL for a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_auth_url',
        description: 'Get OneDrive OAuth authorization URL',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_fodi_info',
        description: 'Get FODI configuration and status information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_files':
          return await handleListFiles(args);
        case 'search_files':
          return await handleSearchFiles(args);
        case 'get_file_info':
          return await handleGetFileInfo(args);
        case 'get_download_url':
          return await handleGetDownloadUrl(args);
        case 'get_auth_url':
          return await handleGetAuthUrl(args);
        case 'get_fodi_info':
          return await handleGetFodiInfo(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });
}

async function handleListFiles(args: { path?: string }) {
  const path = args.path || '/';
  
  try {
    const response = await listFiles(path);
    const data = await response.json();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path,
            files: data.value || [],
            total: data.value?.length || 0,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleSearchFiles(args: { query: string }) {
  try {
    const response = await searchFiles(args.query);
    const data = await response.json();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            results: data.value || [],
            total: data.value?.length || 0,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to search files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleGetFileInfo(args: { path: string }) {
  try {
    const response = await getFileInfo(args.path);
    const data = await response.json();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleGetDownloadUrl(args: { path: string }) {
  try {
    const response = await getDownloadUrl(args.path);
    const data = await response.json();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path: args.path,
            download_url: data.downloadUrl || data['@microsoft.graph.downloadUrl'],
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleGetAuthUrl(args: {}) {
  // This would need to be implemented based on FODI's OAuth flow
  const oauthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + 
    new URLSearchParams({
      client_id: '78d4dc35-7e46-42c6-9023-2d39314433a5',
      response_type: 'code',
      redirect_uri: 'http://localhost/onedrive-login',
      scope: 'offline_access User.Read Files.ReadWrite.All',
      response_mode: 'query',
    }).toString();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          auth_url: oauthUrl,
          client_id: '78d4dc35-7e46-42c6-9023-2d39314433a5',
          redirect_uri: 'http://localhost/onedrive-login',
        }, null, 2),
      },
    ],
  };
}

async function handleGetFodiInfo(args: {}) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          name: 'FODI',
          version: '1.0.0',
          description: 'OneDrive Directory Index',
          features: [
            'File browsing and downloading',
            'WebDAV support',
            'MCP protocol support',
            'Server-Sent Events (SSE)',
            'Caching',
            'Directory protection',
          ],
          endpoints: {
            webdav: '/',
            mcp: '/mcp',
            sse: '/sse',
            deploy: '/deployfodi',
          },
        }, null, 2),
      },
    ],
  };
}