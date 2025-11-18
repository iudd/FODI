#!/usr/bin/env node
/**
 * @fileoverview FODI MCP Client Example
 * @example node examples/mcp-client.js
 */

class FODIMCPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.requestId = 0;
  }

  async callTool(toolName, arguments = {}) {
    const request = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: arguments
      }
    };

    console.log(`🔧 调用工具: ${toolName}`, arguments);

    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        console.error(`❌ 错误:`, result.error);
        return null;
      }

      console.log(`✅ 响应:`, result.result);
      return result.result;
    } catch (error) {
      console.error(`❌ 请求失败:`, error.message);
      return null;
    }
  }

  async listTools() {
    const request = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "tools/list"
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      return result.result?.tools || [];
    } catch (error) {
      console.error(`❌ 获取工具列表失败:`, error.message);
      return [];
    }
  }

  async listFiles(path = '/') {
    return await this.callTool('list_files', { path });
  }

  async searchFiles(query) {
    return await this.callTool('search_files', { query });
  }

  async getFileInfo(path) {
    return await this.callTool('get_file_info', { path });
  }

  async getDownloadUrl(path) {
    return await this.callTool('get_download_url', { path });
  }

  async getAuthUrl() {
    return await this.callTool('get_auth_url', {});
  }

  async getFodiInfo() {
    return await this.callTool('get_fodi_info', {});
  }
}

// SSE 客户端
class FODISSEClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.eventSource = null;
  }

  connect() {
    console.log('📡 连接 SSE...');
    
    this.eventSource = new EventSource(`${this.baseUrl}/sse`);

    this.eventSource.onopen = () => {
      console.log('✅ SSE 连接已建立');
    };

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 收到事件:', data);
      
      switch(data.type) {
        case 'connected':
          console.log(`🔗 客户端 ID: ${data.clientId}`);
          break;
        case 'file_change':
          console.log(`📁 文件变更: ${data.type} - ${data.file.name}`);
          break;
        case 'ping':
          console.log('💓 心跳:', data.timestamp);
          break;
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ SSE 错误:', error);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 SSE 连接已断开');
    }
  }
}

// 主程序
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:8787';
  
  console.log(`🚀 FODI MCP 客户端`);
  console.log(`🌐 服务器: ${baseUrl}`);
  console.log('');

  const mcpClient = new FODIMCPClient(baseUrl);

  // 获取可用工具
  console.log('📋 获取可用工具...');
  const tools = await mcpClient.listTools();
  console.log(`🔧 可用工具 (${tools.length} 个):`);
  tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log('');

  // 测试各个工具
  console.log('🧪 测试 MCP 工具...');
  console.log('');

  // 1. 获取 FODI 信息
  console.log('1️⃣ 获取 FODI 信息:');
  await mcpClient.getFodiInfo();
  console.log('');

  // 2. 列出根目录文件
  console.log('2️⃣ 列出根目录文件:');
  await mcpClient.listFiles('/');
  console.log('');

  // 3. 搜索文件
  console.log('3️⃣ 搜索文件 (包含 "doc"):');
  await mcpClient.searchFiles('doc');
  console.log('');

  // 4. 获取认证链接
  console.log('4️⃣ 获取 OAuth 认证链接:');
  await mcpClient.getAuthUrl();
  console.log('');

  // 5. 连接 SSE
  console.log('5️⃣ 连接 SSE (5秒后自动断开):');
  const sseClient = new FODISSEClient(baseUrl);
  sseClient.connect();
  
  setTimeout(() => {
    sseClient.disconnect();
    console.log('');
    console.log('✨ 测试完成！');
  }, 5000);
}

// 运行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FODIMCPClient, FODISSEClient };