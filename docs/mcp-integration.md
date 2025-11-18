# FODI MCP 集成文档

## 🚀 概述

FODI 现在支持 Model Context Protocol (MCP)，允许 AI 助手通过标准协议与 OneDrive 文件系统交互。

## 📡 API 端点

### MCP HTTP 端点
```
POST /mcp
```
处理 MCP JSON-RPC 请求

### SSE 端点
```
GET /sse
```
实时事件流，用于文件变更通知

## 🛠️ MCP 工具

### 1. list_files
列出指定目录中的文件和文件夹

**参数：**
- `path` (可选): 目录路径，默认为根目录 "/"

**示例：**
```json
{
  "tool": "list_files",
  "arguments": {
    "path": "/Documents"
  }
}
```

### 2. search_files
搜索文件（基于文件名匹配）

**参数：**
- `query` (必需): 搜索查询字符串

**示例：**
```json
{
  "tool": "search_files",
  "arguments": {
    "query": "report.pdf"
  }
}
```

### 3. get_file_info
获取文件的详细信息

**参数：**
- `path` (必需): 文件路径

**示例：**
```json
{
  "tool": "get_file_info",
  "arguments": {
    "path": "/Documents/report.pdf"
  }
}
```

### 4. get_download_url
获取文件的下载链接

**参数：**
- `path` (必需): 文件路径

**示例：**
```json
{
  "tool": "get_download_url",
  "arguments": {
    "path": "/Documents/report.pdf"
  }
}
```

### 5. get_auth_url
获取 OneDrive OAuth 认证链接

**示例：**
```json
{
  "tool": "get_auth_url",
  "arguments": {}
}
```

### 6. get_fodi_info
获取 FODI 配置和状态信息

**示例：**
```json
{
  "tool": "get_fodi_info",
  "arguments": {}
}
```

## 🔧 客户端配置

### MCP 客户端配置示例

```json
{
  "mcpServers": {
    "fodi": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "@-",
        "https://your-worker.your-subdomain.workers.dev/mcp"
      ],
      "env": {}
    }
  }
}
```

### JavaScript 客户端示例

```javascript
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

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    return await response.json();
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
}

// 使用示例
const client = new FODIMCPClient('https://your-worker.workers.dev');

// 列出根目录文件
const files = await client.listFiles();
console.log('Files:', files);

// 搜索文件
const searchResults = await client.searchFiles('document');
console.log('Search results:', searchResults);
```

## 📡 SSE 实时更新

### 连接 SSE

```javascript
const eventSource = new EventSource('https://your-worker.workers.dev/sse');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
  
  switch(data.type) {
    case 'connected':
      console.log('SSE 连接已建立:', data.clientId);
      break;
    case 'file_change':
      console.log('文件变更:', data);
      break;
    case 'ping':
      console.log('心跳:', data.timestamp);
      break;
  }
};

eventSource.onerror = function(error) {
  console.error('SSE 错误:', error);
};
```

### 事件类型

- `connected`: 连接建立
- `file_change`: 文件变更通知
- `ping`: 心跳保持连接

## 🔄 部署

1. **安装依赖**
```bash
cd back-end-cf
npm install
```

2. **配置环境变量**
确保 `wrangler.jsonc` 中的配置正确

3. **部署**
```bash
npm run deploy
```

4. **测试**
```bash
# 测试 MCP 端点
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# 测试 SSE 端点
curl -N https://your-worker.workers.dev/sse
```

## 🛡️ 安全特性

- **CORS 配置**: 支持跨域请求
- **OAuth 认证**: OneDrive 安全认证
- **缓存控制**: 智能缓存策略
- **请求验证**: 参数验证和错误处理

## 📝 注意事项

1. **认证**: 确保已正确配置 OneDrive OAuth
2. **权限**: 确保应用有足够的 OneDrive 访问权限
3. **缓存**: MCP 请求默认不缓存，确保数据实时性
4. **SSE 连接**: 长连接需要适当的超时处理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 MCP 集成！