import * as fs from 'fs';
import * as path from 'path';
import { FeatureFlag } from './types';

export class FlagStore {
  private dbPath?: string;
  private db?: any;
  private redisClient?: any;
  private redisKey: string = 'flags_local:store';
  private redisChannel: string = 'flags_local:events';
  private flags: Map<string, FeatureFlag> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(options: { dbPath?: string; redisUrl?: string } = {}) {
    if (options.redisUrl) {
      this.initRedis(options.redisUrl);
    } else {
      this.dbPath = options.dbPath || path.join(process.cwd(), 'flags.db');
      this.initSqlite();
    }
  }

  private initSqlite(): void {
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);
      // WAL mode for fast concurrent reads & writes
      this.db.pragma('journal_mode = WAL');

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS flags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          enabled INTEGER NOT NULL DEFAULT 1,
          percentage INTEGER,
          environments TEXT NOT NULL,
          tags TEXT,
          rules TEXT,
          value TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      this.loadFromSqlite();
    } catch (err) {
      console.warn('[flags-local] SQLite init failed, falling back to JSON in-memory:', err);
    }
  }

  private loadFromSqlite(): void {
    try {
      const rows = this.db.prepare('SELECT * FROM flags').all();
      if (rows && rows.length > 0) {
        this.flags.clear();
        for (const row of rows) {
          this.flags.set(row.id, {
            id: row.id,
            name: row.name,
            description: row.description || '',
            enabled: Boolean(row.enabled),
            percentage: row.percentage !== null ? row.percentage : undefined,
            environments: JSON.parse(row.environments || '{}'),
            tags: row.tags ? JSON.parse(row.tags) : [],
            rules: row.rules ? JSON.parse(row.rules) : [],
            value: row.value ? JSON.parse(row.value) : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          });
        }
      } else {
        this.seedDefaults();
        this.saveToSqliteBatch(Array.from(this.flags.values()));
      }
    } catch (err) {
      console.error('[flags-local] Error reading from SQLite database:', err);
    }
  }

  private saveToSqliteBatch(list: FeatureFlag[]): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO flags (id, name, description, enabled, percentage, environments, tags, rules, value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = this.db.transaction((flags: FeatureFlag[]) => {
      for (const f of flags) {
        stmt.run(
          f.id,
          f.name,
          f.description || '',
          f.enabled ? 1 : 0,
          f.percentage !== undefined ? f.percentage : null,
          JSON.stringify(f.environments || {}),
          JSON.stringify(f.tags || []),
          JSON.stringify(f.rules || []),
          f.value !== undefined ? JSON.stringify(f.value) : null,
          f.createdAt || new Date().toISOString(),
          f.updatedAt || new Date().toISOString()
        );
      }
    });
    insertMany(list);
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
      console.error('[flags-local] Redis connection error, falling back to local SQLite:', err);
      this.dbPath = path.join(process.cwd(), 'flags.db');
      this.initSqlite();
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

  public async set(flag: FeatureFlag): Promise<void> {
    flag.updatedAt = new Date().toISOString();
    if (!flag.createdAt) flag.createdAt = flag.updatedAt;
    this.flags.set(flag.id, flag);

    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO flags (id, name, description, enabled, percentage, environments, tags, rules, value, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          flag.id,
          flag.name,
          flag.description || '',
          flag.enabled ? 1 : 0,
          flag.percentage !== undefined ? flag.percentage : null,
          JSON.stringify(flag.environments || {}),
          JSON.stringify(flag.tags || []),
          JSON.stringify(flag.rules || []),
          flag.value !== undefined ? JSON.stringify(flag.value) : null,
          flag.createdAt,
          flag.updatedAt
        );
      } catch (err) {
        console.error('[flags-local] SQLite write error:', err);
      }
    }

    if (this.redisClient) {
      try {
        const json = JSON.stringify(Array.from(this.flags.values()));
        await this.redisClient.set(this.redisKey, json);
        await this.redisClient.publish(this.redisChannel, json);
      } catch (err) {
        console.error('[flags-local] Redis publish error:', err);
      }
    }

    this.notifyLocal();
  }

  public async delete(id: string): Promise<boolean> {
    const res = this.flags.delete(id);
    if (res) {
      if (this.db) {
        try {
          this.db.prepare('DELETE FROM flags WHERE id = ?').run(id);
        } catch (err) {
          console.error('[flags-local] SQLite delete error:', err);
        }
      }
      if (this.redisClient) {
        try {
          const json = JSON.stringify(Array.from(this.flags.values()));
          await this.redisClient.set(this.redisKey, json);
          await this.redisClient.publish(this.redisChannel, json);
        } catch {}
      }
      this.notifyLocal();
    }
    return res;
  }

  public getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public get(id: string): FeatureFlag | undefined {
    return this.flags.get(id);
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
