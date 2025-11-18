/**
 * @fileoverview Configuration management for FODI MCP Server
 * @module src/config
 */

interface AppConfig {
  // OneDrive Configuration
  onedriveClientId: string;
  onedriveClientSecret: string;
  onedriveRedirectUri: string;
  onedriveApiHost: string;

  // MCP Server Configuration
  mcpServerName: string;
  mcpServerVersion: string;
  mcpTransportType: 'http' | 'stdio';
  mcpHttpPort: number;
  mcpHttpHost: string;
  mcpHttpEndpointPath: string;
  mcpLogLevel: string;

  // SSE Configuration
  enableSse: boolean;

  // Environment
  environment: 'development' | 'production';
}

/**
 * Parse configuration from environment variables
 */
export const config: AppConfig = {
  // OneDrive Configuration
  onedriveClientId: process.env.ONEDRIVE_CLIENT_ID || '',
  onedriveClientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
  onedriveRedirectUri: process.env.ONEDRIVE_REDIRECT_URI || 'http://localhost/onedrive-login',
  onedriveApiHost: process.env.ONEDRIVE_API_HOST || 'https://graph.microsoft.com',

  // MCP Server Configuration
  mcpServerName: process.env.MCP_SERVER_NAME || 'FODI MCP Server',
  mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  mcpTransportType: (process.env.MCP_TRANSPORT_TYPE as 'http' | 'stdio') || 'http',
  mcpHttpPort: parseInt(process.env.MCP_HTTP_PORT || '8787', 10),
  mcpHttpHost: process.env.MCP_HTTP_HOST || '0.0.0.0',
  mcpHttpEndpointPath: process.env.MCP_HTTP_ENDPOINT_PATH || '/mcp',
  mcpLogLevel: process.env.MCP_LOG_LEVEL || 'info',

  // SSE Configuration
  enableSse: process.env.ENABLE_SSE === 'true',

  // Environment
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
};

export default config;