/**
 * @fileoverview MCP Tools for FODI OneDrive operations
 * @module src/mcp/tools
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { fetchFiles, downloadFile } from '../services/fileMethods';
import { runtimeEnv } from '../types/env';

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
    const result = await fetchFiles(path);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path: result.parent,
            files: result.files,
            total: result.files.length,
            hasMore: !!result.skipToken,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleSearchFiles(args: { query: string }) {
  // FODI doesn't have a built-in search function, so we'll implement a simple file listing with filter
  try {
    // For now, we'll list root files and filter by name
    const result = await fetchFiles('/');
    const filteredFiles = result.files.filter(file => 
      file.name.toLowerCase().includes(args.query.toLowerCase())
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            results: filteredFiles,
            total: filteredFiles.length,
            note: 'Search is limited to filename matching in root directory',
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
    const result = await fetchFiles(args.path);
    
    if (result.files.length === 0) {
      throw new Error('File not found');
    }
    
    const file = result.files[0];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            name: file.name,
            size: file.size,
            lastModifiedDateTime: file.lastModifiedDateTime,
            downloadUrl: file.url,
            path: args.path,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleGetDownloadUrl(args: { path: string }) {
  try {
    const result = await fetchFiles(args.path);
    
    if (result.files.length === 0) {
      throw new Error('File not found');
    }
    
    const file = result.files[0];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path: args.path,
            download_url: file.url,
            name: file.name,
            size: file.size,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleGetAuthUrl(args: {}) {
  const oauthUrl = runtimeEnv.OAUTH.oauthUrl + 'authorize?' + 
    new URLSearchParams({
      client_id: runtimeEnv.OAUTH.clientId,
      response_type: 'code',
      redirect_uri: runtimeEnv.OAUTH.redirectUri,
      scope: runtimeEnv.OAUTH.scope,
      response_mode: 'query',
    }).toString();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          auth_url: oauthUrl,
          client_id: runtimeEnv.OAUTH.clientId,
          redirect_uri: runtimeEnv.OAUTH.redirectUri,
          scope: runtimeEnv.OAUTH.scope,
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
            'File upload support',
          ],
          configuration: {
            exposed_path: runtimeEnv.PROTECTED.EXPOSE_PATH || '/',
            proxy_keyword: runtimeEnv.PROTECTED.PROXY_KEYWORD || null,
            protected_layers: runtimeEnv.PROTECTED.PROTECTED_LAYERS,
            cache_ttl: runtimeEnv.PROTECTED.CACHE_TTLMAP,
          },
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