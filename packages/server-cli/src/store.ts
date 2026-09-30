import * as fs from 'fs';
import * as path from 'path';
import { FeatureFlag } from './types';

export class FlagStore {
  private filePath: string;
  private flags: Map<string, FeatureFlag> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'flags.json');
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.flags.clear();
          for (const item of data) {
            this.flags.set(item.id, item);
          }
        }
      } catch (err) {
        console.error(`[flags-local] Error reading ${this.filePath}:`, err);
      }
    } else {
      // Seed default sample flags
      this.seedDefaults();
      this.save();
    }
  }

  private seedDefaults(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'new-checkout-flow',
        name: 'New Checkout Flow',
        description: 'Multi-step frictionless checkout with Apple Pay & Google Pay',
        enabled: true,
        percentage: 50,
        environments: { development: true, staging: true, production: false },
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dark-mode-theme',
        name: 'Dark Mode Theme',
        description: 'OLED optimized dark mode theme',
        enabled: true,
        environments: { development: true, staging: true, production: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    for (const flag of defaultFlags) {
      this.flags.set(flag.id, flag);
    }
  }

  public save(): void {
    try {
      const list = Array.from(this.flags.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
      this.notify();
    } catch (err) {
      console.error(`[flags-local] Failed to persist ${this.filePath}:`, err);
    }
  }

  public getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public get(id: string): FeatureFlag | undefined {
    return this.flags.get(id);
  }

  public set(flag: FeatureFlag): void {
    flag.updatedAt = new Date().toISOString();
    if (!flag.createdAt) flag.createdAt = flag.updatedAt;
    this.flags.set(flag.id, flag);
    this.save();
  }

  public delete(id: string): boolean {
    const res = this.flags.delete(id);
    if (res) this.save();
    return res;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[flags-local] Error notifying subscriber:', err);
      }
    }
  }
}
