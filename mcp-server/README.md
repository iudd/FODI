# FODI MCP Server

基于 mcp-ts-template 构建的 FODI OneDrive MCP 服务器，支持 Server-Sent Events (SSE) 实时更新。

## 🚀 功能特性

- **OneDrive 集成**: 完整的 OneDrive API 支持
- **MCP 协议**: 遵循 Model Context Protocol 规范
- **SSE 支持**: 实时文件变更通知
- **Cloudflare Workers**: 无服务器部署
- **TypeScript**: 类型安全的开发体验

## 📦 部署到 Cloudflare Workers

### 1. 安装依赖
```bash
cd mcp-server
npm install
```

### 2. 配置环境变量
编辑 `wrangler.toml` 中的配置：

```toml
[vars]
ONEDRIVE_CLIENT_ID = "your_client_id"
ONEDRIVE_CLIENT_SECRET = "your_client_secret"
ONEDRIVE_REDIRECT_URI = "http://localhost/onedrive-login"
```

### 3. 部署
```bash
npm run deploy
```

## 🔧 开发模式

```bash
npm run dev
```

## 📡 API 端点

### MCP HTTP 端点
```
POST /mcp
```
MCP JSON-RPC 请求处理

### SSE 端点
```
GET /sse
```
实时事件流

### OAuth 回调
```
GET /oauth/callback?code=xxx
```
OneDrive OAuth 认证回调

### 健康检查
```
GET /healthz
```
服务状态检查

## 🛠️ MCP 工具

### 文件管理
- `list_files`: 列出目录文件
- `search_files`: 搜索文件
- `get_file_info`: 获取文件详情
- `get_download_url`: 获取下载链接

### 认证
- `get_auth_url`: 获取 OAuth 认证链接

### 实时更新
- `subscribe_changes`: 订阅文件变更
- `get_sse_status`: 获取 SSE 连接状态

## 📝 使用示例

### MCP 客户端配置
```json
{
  "mcpServers": {
    "fodi": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-worker.your-subdomain.workers.dev/mcp"],
      "env": {}
    }
  }
}
```

### SSE 客户端
```javascript
const eventSource = new EventSource('https://your-worker.workers.dev/sse');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
};
```

## 🔄 实时更新流程

1. 客户端连接到 `/sse` 端点
2. 服务器建立 SSE 连接
3. 文件变更时，服务器推送事件到所有连接的客户端
4. 客户端接收实时更新

## 🛡️ 安全特性

- CORS 配置
- OAuth 2.0 认证
- 请求验证
- 连接超时处理

## 📊 监控

访问根路径获取服务器状态：
```bash
curl https://your-worker.workers.dev/
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License