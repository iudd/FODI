/**
 * @fileoverview MCP (Model Context Protocol) handler for FODI
 * @module src/handlers/mcp-handler
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPTransport } from '@hono/mcp';

import { handleMcpTools } from '../mcp/tools';
import { SseService } from '../mcp/sse';

const mcpServer = new McpServer(
  {
    name: 'FODI MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register MCP tools
handleMcpTools(mcpServer);

export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  const transport = new StreamableHTTPTransport();
  
  await mcpServer.connect(transport);
  const response = await transport.handleRequest(request);
  
  if (response) {
    return response;
  }
  
  return new Response(null, { status: 204 });
}

export async function handleSseRequest(request: Request, env: Env): Promise<Response> {
  const sseService = new SseService(env);
  
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = readable.getReader();

  // Set SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Add client to SSE service
  sseService.addClient(clientId, writer);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    sseService.removeClient(clientId);
  });

  // Return SSE stream
  return new Response(reader, { headers });
}