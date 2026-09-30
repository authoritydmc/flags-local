# 🚩 flags-local

<div align="center">

**Lightweight, zero-dependency, self-hostable Feature Flags platform with real-time UI, SSE streaming, and native SDKs across modern stacks.**

[![npm server](https://img.shields.io/npm/v/flags-local.svg?label=server-cli&color=blue)](https://www.npmjs.com/package/flags-local)
[![npm js client](https://img.shields.io/npm/v/@authoritydmc/flags-client.svg?label=@flags-client&color=green)](https://www.npmjs.com/package/@authoritydmc/flags-client)
[![npm react](https://img.shields.io/npm/v/@authoritydmc/flags-react.svg?label=@flags-react&color=cyan)](https://www.npmjs.com/package/@authoritydmc/flags-react)
[![PyPI](https://img.shields.io/pypi/v/flags-local.svg?color=yellow)](https://pypi.org/project/flags-local/)
[![Maven Central](https://img.shields.io/maven-central/v/io.github.authoritydmc/spring-boot-starter-flags-local.svg?color=red)](https://central.sonatype.com/artifact/io.github.authoritydmc/spring-boot-starter-flags-local)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ⚡ 1. Start the Server & UI in 1 Second

No Docker, no databases, and zero configuration required. Run:

```bash
npx flags-local
```
Or specify a custom port / persistent storage file:
```bash
npx flags-local --port 4040 --file ./custom-flags.json
```

Open **http://localhost:4040** to access the live Tailwind dark-mode Web Dashboard!

---

## 📦 2. Client Libraries Across All Modern Stacks

### ☕ Java / Spring Boot 3+ Starter
Add dependency:
```xml
<dependency>
    <groupId>io.github.authoritydmc</groupId>
    <artifactId>spring-boot-starter-flags-local</artifactId>
    <version>1.0.0</version>
</dependency>
```

Annotate any service method or controller with `@FeatureGate`:
```java
@Service
public class CheckoutService {

    @FeatureGate(value = "new-checkout-flow", fallbackMethod = "legacyCheckout")
    public OrderResponse checkout(OrderRequest request) {
        return processNewCheckout(request);
    }

    public OrderResponse legacyCheckout(OrderRequest request) {
        return processLegacyCheckout(request);
    }
}
```

---

### ⚛️ React / Next.js
Install:
```bash
npm install @authoritydmc/flags-react @authoritydmc/flags-client
```

Usage:
```tsx
import { FlagsProvider, useFlag, FeatureGate } from '@authoritydmc/flags-react';

function App() {
  return (
    <FlagsProvider config={{ baseUrl: 'http://localhost:4040', environment: 'production' }}>
      <FeatureGate flag="ai-assistant-v2" fallback={<ClassicHelp />}>
        <AiChatWidget />
      </FeatureGate>
    </FlagsProvider>
  );
}
```

---

### 🐍 Python (FastAPI / Asyncio / Sync)
Install:
```bash
pip install flags-local
```

Usage:
```python
from flags_local import FlagsLocalClient

client = FlagsLocalClient(base_url="http://localhost:4040", environment="production")
client.fetch_flags()

if client.is_enabled("dark-mode-theme", user_key="user_42"):
    render_dark_theme()
```

---

### 🌐 Universal JavaScript / TypeScript / Node.js
```bash
npm install @authoritydmc/flags-client
```

```typescript
import { FlagsLocalClient } from '@authoritydmc/flags-client';

const client = new FlagsLocalClient({ baseUrl: 'http://localhost:4040' });
console.log(client.isEnabled('dark-mode-theme'));
```

---

## 🛠️ Monorepo Structure

```text
flags-local/
├── packages/
│   ├── server-cli/            # npx flags-local (Server + UI + SSE stream)
│   ├── client-js/             # @authoritydmc/flags-client
│   ├── client-react/          # @authoritydmc/flags-react
│   ├── client-python/         # flags-local on PyPI
│   └── client-spring-boot/    # spring-boot-starter-flags-local on Maven Central
└── .github/workflows/
    └── release.yml            # Automated multi-registry publishing
```

---

## 📄 License
MIT © [Raj Dubey](https://github.com/authoritydmc)
