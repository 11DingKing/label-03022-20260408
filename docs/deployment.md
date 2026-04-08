# 部署与运维文档

## 概述

本文档描述视频分析AI应用的部署流程、运维监控和故障排查指南。

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                        负载均衡器                            │
│                    (Nginx / ALB / CLB)                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   前端容器 #1   │ │   前端容器 #2   │ │   前端容器 #N   │
│   (Nginx)       │ │   (Nginx)       │ │   (Nginx)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 API 服务                           │
│                   (可选，当前为 Mock)                        │
└─────────────────────────────────────────────────────────────┘
```

## Docker 部署

### 构建镜像

```bash
# 进入前端目录
cd frontend-admin

# 构建 Docker 镜像
docker build -t video-analysis-frontend:latest .

# 查看镜像
docker images | grep video-analysis
```

### 运行容器

```bash
# 单容器运行
docker run -d \
  --name video-analysis-web \
  -p 80:80 \
  -e VITE_USE_MOCK=true \
  video-analysis-frontend:latest

# 查看容器状态
docker ps | grep video-analysis

# 查看日志
docker logs -f video-analysis-web
```

### Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend-admin
    ports:
      - "80:80"
    environment:
      - VITE_USE_MOCK=true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 环境配置

### 环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| VITE_USE_MOCK | 是否使用 Mock 数据 | true | false |
| VITE_API_BASE_URL | API 基础路径 | /api | https://api.example.com |

### Nginx 配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（如需要）
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 健康检查端点
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

## 监控指标

### 应用监控

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| 响应时间 | 页面加载时间 | > 3s |
| 错误率 | JS 错误比例 | > 1% |
| 可用性 | 服务可用时间 | < 99.9% |
| 并发用户 | 同时在线用户 | > 1000 |

### 容器监控

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| CPU 使用率 | 容器 CPU 占用 | > 80% |
| 内存使用率 | 容器内存占用 | > 80% |
| 网络 I/O | 网络流量 | > 100MB/s |
| 磁盘 I/O | 磁盘读写 | > 50MB/s |

### 日志监控

```bash
# 查看 Nginx 访问日志
docker exec video-analysis-web tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
docker exec video-analysis-web tail -f /var/log/nginx/error.log

# 日志格式配置
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time';
```

## 健康检查

### HTTP 健康检查

```bash
# 检查服务是否正常
curl -f http://localhost/health

# 检查页面是否可访问
curl -I http://localhost/
```

### Docker 健康检查

```dockerfile
# Dockerfile 中配置
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

### Kubernetes 探针

```yaml
# k8s deployment.yaml
livenessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 10
```

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 页面白屏 | JS 加载失败 | 检查网络、清除缓存 |
| 404 错误 | 路由配置错误 | 检查 Nginx try_files |
| API 超时 | 后端服务异常 | 检查后端日志、网络 |
| 样式错乱 | CSS 缓存 | 清除浏览器缓存 |

### 排查步骤

1. **检查容器状态**
```bash
docker ps -a | grep video-analysis
docker logs video-analysis-web --tail 100
```

2. **检查网络连通性**
```bash
curl -v http://localhost/
docker exec video-analysis-web ping backend
```

3. **检查资源使用**
```bash
docker stats video-analysis-web
```

4. **进入容器调试**
```bash
docker exec -it video-analysis-web /bin/sh
```

## 备份与恢复

### 配置备份

```bash
# 备份 Nginx 配置
docker cp video-analysis-web:/etc/nginx/nginx.conf ./backup/

# 备份环境变量
docker inspect video-analysis-web | jq '.[0].Config.Env' > ./backup/env.json
```

### 快速恢复

```bash
# 停止旧容器
docker stop video-analysis-web

# 启动新容器
docker run -d \
  --name video-analysis-web-new \
  -p 80:80 \
  video-analysis-frontend:latest

# 验证服务
curl http://localhost/health
```

## 扩容策略

### 水平扩容

```bash
# Docker Compose 扩容
docker-compose up -d --scale frontend=3

# Kubernetes 扩容
kubectl scale deployment video-analysis --replicas=3
```

### 负载均衡配置

```nginx
# Nginx 负载均衡
upstream frontend {
    least_conn;
    server frontend1:80 weight=1;
    server frontend2:80 weight=1;
    server frontend3:80 weight=1;
}

server {
    location / {
        proxy_pass http://frontend;
    }
}
```

## 安全配置

### HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### 安全头配置

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## 版本管理

### 镜像版本

```bash
# 使用语义化版本
docker build -t video-analysis-frontend:1.0.0 .
docker build -t video-analysis-frontend:1.0.0-$(git rev-parse --short HEAD) .

# 推送到镜像仓库
docker push registry.example.com/video-analysis-frontend:1.0.0
```

### 回滚操作

```bash
# 回滚到上一版本
docker stop video-analysis-web
docker run -d --name video-analysis-web -p 80:80 video-analysis-frontend:0.9.0
```
