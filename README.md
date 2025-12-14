---
title: OmniModel Hub
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
app_port: 3000
pinned: false
secrets:
  - VITE_API_KEY
---

# OmniModel Hub

一个基于 React + Vite 的 AI 模型交互平台，支持多种 AI 模型的集成和对话。

## 功能特性

- 多模型支持
- 云存储集成
- 实时对话界面
- 模型切换和管理

## 本地运行

```bash
npm install
npm run dev
```

## 部署

此项目已配置为可部署到 Hugging Face Spaces。

### HF Spaces 配置说明

- **SDK**: Docker
- **端口**: 3000 (HF Spaces 外部端口，容器内部映射到 80)
- **Secrets**: 需要配置 `VITE_API_KEY` 用于API访问

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference