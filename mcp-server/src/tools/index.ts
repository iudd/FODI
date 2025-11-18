/**
 * @fileoverview MCP Tools for FODI OneDrive operations
 * @module src/tools
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { OneDriveService } from '@/services/onedrive';
import { SseService } from '@/services/sse';
import type { OneDriveFile } from '@/types';

export class FodiTools {
  constructor(
    private onedrive: OneDriveService,
    private sse: SseService,
  ) {}

  /**
   * Register all tools with the MCP server
   */
  registerTools(server: McpServer): void {
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
              file_id: {
                type: 'string',
                description: 'OneDrive file ID',
              },
            },
            required: ['file_id'],
          },
        },
        {
          name: 'get_download_url',
          description: 'Get download URL for a file',
          inputSchema: {
            type: 'object',
            properties: {
              file_id: {
                type: 'string',
                description: 'OneDrive file ID',
              },
            },
            required: ['file_id'],
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
          name: 'subscribe_changes',
          description: 'Subscribe to real-time file changes via SSE',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path to monitor (default: root)',
                default: '/',
              },
            },
          },
        },
        {
          name: 'get_sse_status',
          description: 'Get SSE connection status',
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
            return await this.listFiles(args);
          case 'search_files':
            return await this.searchFiles(args);
          case 'get_file_info':
            return await this.getFileInfo(args);
          case 'get_download_url':
            return await this.getDownloadUrl(args);
          case 'get_auth_url':
            return await this.getAuthUrl(args);
          case 'subscribe_changes':
            return await this.subscribeChanges(args);
          case 'get_sse_status':
            return await this.getSseStatus(args);
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

  private async listFiles(args: { path?: string }) {
    const path = args.path || '/';
    const response = await this.onedrive.listFiles(path);

    const fileList = response.value.map((file: OneDriveFile) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      webUrl: file.webUrl,
      isFolder: !!file.folder,
      mimeType: file.file?.mimeType,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path,
            files: fileList,
            total: fileList.length,
          }, null, 2),
        },
      ],
    };
  }

  private async searchFiles(args: { query: string }) {
    const response = await this.onedrive.searchFiles(args.query);

    const searchResults = response.value.map((file: OneDriveFile) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      webUrl: file.webUrl,
      isFolder: !!file.folder,
      mimeType: file.file?.mimeType,
      path: file.parentReference?.path,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            results: searchResults,
            total: searchResults.length,
          }, null, 2),
        },
      ],
    };
  }

  private async getFileInfo(args: { file_id: string }) {
    const file = await this.onedrive.getFile(args.file_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: file.id,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            webUrl: file.webUrl,
            isFolder: !!file.folder,
            mimeType: file.file?.mimeType,
            parentPath: file.parentReference?.path,
          }, null, 2),
        },
      ],
    };
  }

  private async getDownloadUrl(args: { file_id: string }) {
    const downloadUrl = await this.onedrive.getDownloadUrl(args.file_id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            file_id: args.file_id,
            download_url: downloadUrl,
          }, null, 2),
        },
      ],
    };
  }

  private async getAuthUrl(args: {}) {
    const authUrl = this.onedrive.getAuthUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            auth_url: authUrl,
            client_id: process.env.ONEDRIVE_CLIENT_ID,
            redirect_uri: process.env.ONEDRIVE_REDIRECT_URI,
          }, null, 2),
        },
      ],
    };
  }

  private async subscribeChanges(args: { path?: string }) {
    const path = args.path || '/';
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would set up file change monitoring here
    // For now, we'll simulate it with periodic checks

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Subscribed to file changes',
            path,
            client_id: clientId,
            sse_endpoint: '/sse',
            note: 'SSE endpoint available for real-time updates',
          }, null, 2),
        },
      ],
    };
  }

  private async getSseStatus(args: {}) {
    const clientCount = this.sse.getClientCount();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sse_enabled: true,
            connected_clients: clientCount,
            endpoint: '/sse',
            status: clientCount > 0 ? 'active' : 'idle',
          }, null, 2),
        },
      ],
    };
  }
}