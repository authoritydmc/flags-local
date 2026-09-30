export interface ClientConfig {
  baseUrl?: string; // e.g. "http://localhost:4040"
  environment?: string; // "development", "staging", "production"
  defaultFlags?: Record<string, boolean>;
  autoStream?: boolean; // connect to SSE stream
  pollingIntervalMs?: number;
}

export interface UserContext {
  key?: string;
  attributes?: Record<string, any>;
}

export interface FlagRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'greaterThan' | 'lessThan' | 'percentage';
  value: any;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  value?: any;
  percentage?: number;
  environments: Record<string, boolean>;
  rules?: FlagRule[];
}

export class FlagsLocalClient {
  private baseUrl: string;
  private environment: string;
  private flags: Map<string, FeatureFlag> = new Map();
  private defaultFlags: Record<string, boolean>;
  private listeners: Set<(flagId?: string) => void> = new Set();
  private eventSource: any = null;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl || 'http://localhost:4040').replace(/\/$/, '');
    this.environment = config.environment || 'development';
    this.defaultFlags = config.defaultFlags || {};

    if (config.autoStream !== false) {
      this.initStream();
    }
  }

  public async fetchFlags(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/flags`);
      if (res.ok) {
        const list: FeatureFlag[] = await res.json();
        this.updateFlags(list);
      }
    } catch (err) {
      console.warn('[flags-local-client] Failed to fetch flags from server:', err);
    }
  }

  private initStream(): void {
    if (typeof EventSource !== 'undefined') {
      try {
        this.eventSource = new EventSource(`${this.baseUrl}/api/v1/flags/stream`);
        this.eventSource.onmessage = (evt: any) => {
          try {
            const list: FeatureFlag[] = JSON.parse(evt.data);
            this.updateFlags(list);
          } catch {}
        };
      } catch (err) {
        console.warn('[flags-local-client] EventSource initialization failed:', err);
      }
    } else {
      this.fetchFlags();
    }
  }

  private updateFlags(list: FeatureFlag[]): void {
    this.flags.clear();
    for (const item of list) {
      this.flags.set(item.id, item);
    }
    this.notify();
  }

  public isEnabled(flagId: string, context: UserContext = {}, fallback?: boolean): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) {
      return fallback !== undefined ? fallback : (this.defaultFlags[flagId] ?? false);
    }

    const envEnabled = flag.environments?.[this.environment] !== undefined
      ? flag.environments[this.environment]
      : flag.enabled;

    if (!envEnabled) return false;

    // Rules
    if (flag.rules && flag.rules.length > 0) {
      for (const rule of flag.rules) {
        const val = context.attributes?.[rule.attribute] ?? (rule.attribute === 'key' ? context.key : undefined);
        if (val !== undefined) {
          if (rule.operator === 'equals' && String(val) === String(rule.value)) return true;
          if (rule.operator === 'contains' && String(val).includes(String(rule.value))) return true;
          if (rule.operator === 'in' && Array.isArray(rule.value) && rule.value.map(String).includes(String(val))) return true;
        }
      }
      if (flag.percentage === undefined) return false;
    }

    // Percentage
    if (flag.percentage !== undefined && flag.percentage !== null) {
      const key = context.key || 'anonymous';
      const hash = this.simpleHash(`${flag.id}:${key}`);
      return hash < flag.percentage;
    }

    return true;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  public onChange(listener: (flagId?: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {}
    }
  }

  public close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
