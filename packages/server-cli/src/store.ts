import * as fs from 'fs';
import * as path from 'path';
import { FeatureFlag } from './types';

export class FlagStore {
  private filePath?: string;
  private redisClient?: any;
  private redisKey: string = 'flags_local:store';
  private redisChannel: string = 'flags_local:events';
  private flags: Map<string, FeatureFlag> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(options: { filePath?: string; redisUrl?: string } = {}) {
    if (options.redisUrl) {
      this.initRedis(options.redisUrl);
    } else {
      this.filePath = options.filePath || path.join(process.cwd(), 'flags.json');
      this.loadFile();
    }
  }

  private async initRedis(url: string) {
    try {
      const { createClient } = require('redis');
      this.redisClient = createClient({ url });
      await this.redisClient.connect();

      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(this.redisChannel, (message: string) => {
        try {
          const list = JSON.parse(message);
          this.syncMap(list);
          this.notifyLocal();
        } catch {}
      });

      const raw = await this.redisClient.get(this.redisKey);
      if (raw) {
        this.syncMap(JSON.parse(raw));
      } else {
        this.seedDefaults();
        await this.redisClient.set(this.redisKey, JSON.stringify(Array.from(this.flags.values())));
      }
      console.log(`[flags-local] Connected to Redis cluster at ${url}`);
    } catch (err) {
      console.error('[flags-local] Redis connection error, falling back to local file:', err);
      this.filePath = path.join(process.cwd(), 'flags.json');
      this.loadFile();
    }
  }

  private loadFile(): void {
    if (this.filePath && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.syncMap(data);
        }
      } catch (err) {
        console.error(`[flags-local] Error reading ${this.filePath}:`, err);
      }
    } else {
      this.seedDefaults();
      this.save();
    }
  }

  private syncMap(list: FeatureFlag[]): void {
    this.flags.clear();
    for (const item of list) {
      this.flags.set(item.id, item);
    }
  }

  private seedDefaults(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'new-checkout-flow',
        name: 'New Checkout Flow',
        description: 'Multi-step frictionless checkout with Apple Pay, Google Pay, and Crypto',
        enabled: true,
        percentage: 50,
        environments: { development: true, staging: true, production: false },
        tags: ['billing', 'core'],
        rules: [{ attribute: 'role', operator: 'equals', value: 'beta-tester' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ai-copilot-assistant',
        name: 'AI Copilot Assistant',
        description: 'Inline AI coding assistant powered by LLM backend',
        enabled: true,
        environments: { development: true, staging: false, production: false },
        tags: ['ai', 'experimental'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dark-mode-theme',
        name: 'Dark Mode Theme',
        description: 'OLED optimized dark mode theme',
        enabled: true,
        environments: { development: true, staging: true, production: true },
        tags: ['ui'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    for (const flag of defaultFlags) {
      this.flags.set(flag.id, flag);
    }
  }

  public async save(): Promise<void> {
    const list = Array.from(this.flags.values());
    if (this.redisClient) {
      try {
        const json = JSON.stringify(list);
        await this.redisClient.set(this.redisKey, json);
        await this.redisClient.publish(this.redisChannel, json);
      } catch (err) {
        console.error('[flags-local] Redis save error:', err);
      }
    } else if (this.filePath) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
      } catch (err) {
        console.error(`[flags-local] Failed to persist ${this.filePath}:`, err);
      }
    }
    this.notifyLocal();
  }

  public getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public get(id: string): FeatureFlag | undefined {
    return this.flags.get(id);
  }

  public async set(flag: FeatureFlag): Promise<void> {
    flag.updatedAt = new Date().toISOString();
    if (!flag.createdAt) flag.createdAt = flag.updatedAt;
    this.flags.set(flag.id, flag);
    await this.save();
  }

  public async delete(id: string): Promise<boolean> {
    const res = this.flags.delete(id);
    if (res) await this.save();
    return res;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyLocal(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[flags-local] Error notifying subscriber:', err);
      }
    }
  }
}
