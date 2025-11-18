/**
 * @fileoverview Type definitions for FODI MCP Server
 * @module src/types
 */

export interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  lastModified: string;
  webUrl: string;
  parentReference?: {
    path: string;
  };
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
}

export interface OneDriveResponse {
  value: OneDriveFile[];
  '@odata.nextLink'?: string;
}

export interface SseClient {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  lastPing: number;
}

export interface FileChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  file: OneDriveFile;
  timestamp: string;
}

export interface McpContext {
  requestId: string;
  sessionId?: string;
  timestamp: string;
}