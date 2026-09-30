# 🚩 flags-local

<div align="center">

**Zero-dependency, lightning-fast self-hostable Feature Flags platform with real-time UI, Redis cluster syncing, SSE streaming, and native SDKs across modern stacks.**

[![npm server](https://img.shields.io/npm/v/flags-local.svg?label=server-cli&color=blue)](https://www.npmjs.com/package/flags-local)
[![npm js client](https://img.shields.io/npm/v/@authoritydmc/flags-client.svg?label=@flags-client&color=green)](https://www.npmjs.com/package/@authoritydmc/flags-client)
[![npm react](https://img.shields.io/npm/v/@authoritydmc/flags-react.svg?label=@flags-react&color=cyan)](https://www.npmjs.com/package/@authoritydmc/flags-react)
[![npm vue](https://img.shields.io/npm/v/@authoritydmc/flags-vue.svg?label=@flags-vue&color=emerald)](https://www.npmjs.com/package/@authoritydmc/flags-vue)
[![PyPI](https://img.shields.io/pypi/v/flags-local.svg?color=yellow)](https://pypi.org/project/flags-local/)
[![Maven Central](https://img.shields.io/maven-central/v/io.github.authoritydmc/spring-boot-starter-flags-local.svg?color=red)](https://central.sonatype.com/artifact/io.github.authoritydmc/spring-boot-starter-flags-local)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 Highlights

- ⚡ **Zero-Config Setup**: Launch in 1 second with `npx flags-local`.
- 🎛️ **Full CRUD Web Dashboard**: Create, Edit, Toggle, and Delete flags with live environment preview (`development`, `staging`, `production`).
- 🔄 **Redis Cluster Syncing**: Run horizontally across multiple nodes with Redis Pub/Sub syncing (`--redis redis://...`).
- 🧪 **Interactive Rule & Flag Evaluator**: Test hash rollouts and user targeting directly in the web UI.
- 📡 **Real-time SSE Streaming**: Zero client polling lag; instant cache updates across all connected microservices.
- 📦 **Native SDKs**: React, Vue 3, Spring Boot 3+ (Java 21), Python (FastAPI/Asyncio), Go, and Node.js.

---

## ⚡ 1. Launching the Server

### Option A: In-Memory / File Mode
```bash
npx flags-local
```
Or customize port and persistent storage path:
```bash
npx flags-local --port 4040 --file ./flags.json
```

### Option B: Distributed Redis Cluster Mode
```bash
npx flags-local --port 4040 --redis redis://localhost:6379
```
*Or via environment variable:* `REDIS_URL=redis://... npx flags-local`

Visit **http://localhost:4040** to open the modern dark-mode dashboard!

---

## 📦 2. Client Libraries Across All Stacks

### ⚛️ React & Next.js (`@authoritydmc/flags-react`)
```bash
npm install @authoritydmc/flags-react @authoritydmc/flags-client
```
```tsx
import { FlagsProvider, FeatureGate, useFlag } from '@authoritydmc/flags-react';

function App() {
  return (
    <FlagsProvider config={{ baseUrl: 'http://localhost:4040', environment: 'production' }}>
      <FeatureGate flag="ai-copilot-assistant" fallback={<ClassicEditor />}>
        <AiCopilotEditor />
      </FeatureGate>
    </FlagsProvider>
  );
}
```

---

### 🟢 Vue 3 (`@authoritydmc/flags-vue`)
```bash
npm install @authoritydmc/flags-vue @authoritydmc/flags-client
```
```vue
<script setup>
import { initFlags, useFlag, FeatureGate } from '@authoritydmc/flags-vue';

initFlags({ baseUrl: 'http://localhost:4040', environment: 'development' });
const isEnabled = useFlag('new-checkout-flow');
</script>

<template>
  <FeatureGate flag="new-checkout-flow">
    <NewCheckout />
    <template #fallback><LegacyCheckout /></template>
  </FeatureGate>
</template>
```

---

### ☕ Java / Spring Boot 3+ Starter (`spring-boot-starter-flags-local`)
```xml
<dependency>
    <groupId>io.github.authoritydmc</groupId>
    <artifactId>spring-boot-starter-flags-local</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
@Service
public class CheckoutService {

    @FeatureGate(value = "new-checkout-flow", fallbackMethod = "legacyCheckout")
    public OrderResponse checkout(OrderRequest request) {
        return processFastCheckout(request);
    }

    public OrderResponse legacyCheckout(OrderRequest request) {
        return processLegacy(request);
    }
}
```

---

### 🐍 Python / FastAPI (`flags-local`)
```bash
pip install flags-local
```
```python
from flags_local import FlagsLocalClient

client = FlagsLocalClient(base_url="http://localhost:4040", environment="production")
client.fetch_flags()

if client.is_enabled("new-checkout-flow", user_key="usr_987"):
    print("User is enrolled in canary rollout!")
```

---

### 🐹 Go Client (`github.com/authoritydmc/flags-local/packages/client-go`)
```go
import "github.com/authoritydmc/flags-local/packages/client-go"

client := flagslocal.NewClient("http://localhost:4040", "production")
client.FetchFlags()

if client.IsEnabled("new-checkout-flow", "user_123") {
    // Process new flow
}
```

---

### 🌐 Universal JavaScript / TypeScript / Node.js (`@authoritydmc/flags-client`)
```bash
npm install @authoritydmc/flags-client
```
```typescript
import { FlagsLocalClient } from '@authoritydmc/flags-client';

const client = new FlagsLocalClient({ baseUrl: 'http://localhost:4040' });
client.onChange(() => {
  console.log('Flags updated in real-time!');
});
```

---

## 📡 REST API & SSE Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/dashboard` | `GET` | Interactive dark-mode Web Dashboard |
| `/api/v1/flags` | `GET` | Get all feature flags (supports `?tag=billing`) |
| `/api/v1/flags/:id` | `PUT` | Create or update a feature flag |
| `/api/v1/flags/:id` | `DELETE` | Delete a feature flag |
| `/api/v1/flags/stream` | `GET` | Server-Sent Events (SSE) real-time streaming endpoint |
| `/api/v1/evaluate` | `POST` | Evaluate specific flag against user context |
| `/api/v1/evaluate-all` | `POST` | Bulk evaluate all flags for user context |
| `/healthz` | `GET` | Health check endpoint |

---

## 📄 License
MIT © [Raj Dubey](https://github.com/authoritydmc)
