#!/usr/bin/env node
/**
 * @fileoverview Main entry point for FODI MCP Server
 * @module src/index
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPTransport } from '@hono/mcp';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import config from '@/config';
import { OneDriveService } from '@/services/onedrive';
import { SseService } from '@/services/sse';
import { FodiTools } from '@/tools';

// Initialize services
const onedrive = new OneDriveService();
const sse = new SseService();
const tools = new FodiTools(onedrive, sse);

// Initialize MCP server
const server = new McpServer(
  {
    name: config.mcpServerName,
    version: config.mcpServerVersion,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register tools
tools.registerTools(server);

// Create Hono app for HTTP transport
const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
}));

// Health check
app.get('/healthz', (c) => c.json({ status: 'ok' }));

// Server info
app.get('/', (c) => c.json({
  name: config.mcpServerName,
  version: config.mcpServerVersion,
  description: 'FODI OneDrive MCP Server with SSE support',
  environment: config.environment,
  transport: config.mcpTransportType,
  sse_enabled: config.enableSse,
}));

// SSE endpoint
app.get('/sse', async (c) => {
  if (!config.enableSse) {
    return c.json({ error: 'SSE is disabled' }, 501);
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = readable.getReader();

  // Set SSE headers
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  c.header('Access-Control-Allow-Origin', '*');

  // Add client to SSE service
  sse.addClient(clientId, writer);

  // Handle client disconnect
  c.req.raw.signal.addEventListener('abort', () => {
    sse.removeClient(clientId);
  });

  // Return the SSE stream
  return c.newResponse(readable);
});

// MCP HTTP endpoint
app.all('/mcp', async (c) => {
  const transport = new StreamableHTTPTransport();
  
  await server.connect(transport);
  const response = await transport.handleRequest(c);
  
  if (response) {
    return response;
  }
  
  return c.body(null, 204);
});

// OAuth callback handler
app.get('/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  
  if (error) {
    return c.json({ error: 'OAuth failed', details: error }, 400);
  }
  
  if (!code) {
    return c.json({ error: 'Authorization code missing' }, 400);
  }

  try {
    const tokenData = await onedrive.exchangeCodeForToken(code);
    onedrive.setAccessToken(tokenData.access_token);
    
    return c.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });
  } catch (error) {
    return c.json({ 
      error: 'Token exchange failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// File change simulation (for testing SSE)
app.post('/simulate-change', async (c) => {
  if (!config.enableSse) {
    return c.json({ error: 'SSE is disabled' }, 501);
  }

  const body = await c.req.json();
  const { type, file } = body;

  sse.notifyFileChange({
    type,
    file,
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true, message: 'Change event broadcasted' });
});

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
};

// Local development
if (import.meta.env.DEV) {
  console.log(`🚀 ${config.mcpServerName} starting on port ${config.mcpHttpPort}`);
  console.log(`📊 Health: http://localhost:${config.mcpHttpPort}/healthz`);
  console.log(`🔧 MCP: http://localhost:${config.mcpHttpPort}/mcp`);
  console.log(`📡 SSE: http://localhost:${config.mcpHttpPort}/sse`);
}