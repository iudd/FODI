/**
 * @fileoverview Worker environment type definitions
 * @module src/types/worker
 */

export interface Env {
  // OAuth configuration
  OAUTH: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    loginHost: string;
    oauthUrl: string;
    apiHost: string;
    apiUrl: string;
    scope: string;
  };

  // Protected configuration
  PROTECTED: {
    EXPOSE_PATH: string;
    PASSWD_FILENAME: string;
    PROTECTED_LAYERS: number;
    PROXY_KEYWORD: string;
    CACHE_TTLMAP: {
      GET: number;
      POST: number;
    };
  };

  // KV storage
  FODI_CACHE: KVNamespace;

  // Static assets
  ASSETS?: Fetcher;

  // Password for force refresh
  PASSWORD?: string;
}

// MCP related types
export interface McpContext {
  requestId: string;
  sessionId?: string;
  timestamp: string;
}

export interface SseClient {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  lastPing: number;
}

export interface FileChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  file: any;
  timestamp: string;
}