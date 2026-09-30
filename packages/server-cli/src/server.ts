import * as http from 'http';
import { FlagStore } from './store';
import { evaluateFlag } from './evaluator';
import { renderDashboardHtml } from './ui';
import { FeatureFlag } from './types';

export interface ServerOptions {
  port?: number;
  host?: string;
  storePath?: string;
  redisUrl?: string;
}

export function createFlagsServer(options: ServerOptions = {}) {
  const port = options.port || 4040;
  const host = options.host || '0.0.0.0';
  const store = new FlagStore({ filePath: options.storePath, redisUrl: options.redisUrl });

  const sseClients: Set<http.ServerResponse> = new Set();

  store.subscribe(() => {
    const data = JSON.stringify(store.getAll());
    for (const client of sseClients) {
      client.write(`data: ${data}\n\n`);
    }
  });

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Environment');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // 1. Web Dashboard UI
    if (pathname === '/' || pathname === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderDashboardHtml());
      return;
    }

    // 2. SSE Real-Time Stream
    if (pathname === '/api/v1/flags/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`data: ${JSON.stringify(store.getAll())}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // 3. GET /api/v1/flags (optional filter by ?tag=... or ?env=...)
    if (pathname === '/api/v1/flags' && req.method === 'GET') {
      const tag = url.searchParams.get('tag');
      let flags = store.getAll();
      if (tag) {
        flags = flags.filter(f => f.tags && f.tags.includes(tag));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(flags));
      return;
    }

    // 4. POST /api/v1/evaluate
    if (pathname === '/api/v1/evaluate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const flagId = body.flagId || body.flag;
      const context = body.context || {};
      const flag = store.get(flagId);

      if (!flag) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Flag '${flagId}' not found`, enabled: false }));
        return;
      }

      const result = evaluateFlag(flag, context);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // 5. POST /api/v1/evaluate-all
    if (pathname === '/api/v1/evaluate-all' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const context = body.context || {};
      const flags = store.getAll();
      const results: Record<string, boolean> = {};

      for (const flag of flags) {
        results[flag.id] = evaluateFlag(flag, context).enabled;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
      return;
    }

    // 6. PUT /api/v1/flags/:id
    if (pathname.startsWith('/api/v1/flags/') && req.method === 'PUT') {
      const id = pathname.substring('/api/v1/flags/'.length);
      const body: FeatureFlag = await parseJsonBody(req);
      body.id = id;
      await store.set(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, flag: body }));
      return;
    }

    // 7. DELETE /api/v1/flags/:id
    if (pathname.startsWith('/api/v1/flags/') && req.method === 'DELETE') {
      const id = pathname.substring('/api/v1/flags/'.length);
      const deleted = await store.delete(id);
      res.writeHead(deleted ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: deleted }));
      return;
    }

    // 8. Healthcheck
    if (pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', flagsCount: store.getAll().length }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  return {
    server,
    store,
    start: () => {
      server.listen(port, host, () => {
        console.log(`\n🚀 [flags-local] Server running on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
        console.log(`🌐 Dashboard:  http://localhost:${port}`);
        console.log(`📡 API Stream: http://localhost:${port}/api/v1/flags/stream`);
        if (options.redisUrl) {
          console.log(`🔄 Backend:    Redis Cluster (${options.redisUrl})\n`);
        } else {
          console.log(`💾 Backend:    Local JSON File\n`);
        }
      });
    }
  };
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}
