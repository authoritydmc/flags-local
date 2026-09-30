export interface EdgeFlag {
  id: string;
  enabled: boolean;
  percentage?: number;
  environments?: Record<string, boolean>;
}

export interface EdgeConfig {
  baseUrl: string;
  environment?: string;
  initialFlags?: EdgeFlag[];
  revalidateSeconds?: number;
}

export class FlagsEdgeClient {
  private baseUrl: string;
  private environment: string;
  private flags: Map<string, EdgeFlag> = new Map();
  private lastFetched: number = 0;
  private revalidateSeconds: number;

  constructor(config: EdgeConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.environment = config.environment || 'production';
    this.revalidateSeconds = config.revalidateSeconds || 60;

    if (config.initialFlags) {
      for (const f of config.initialFlags) {
        this.flags.set(f.id, f);
      }
    }
  }

  public async getFlag(flagId: string, userKey?: string): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastFetched > this.revalidateSeconds * 1000) {
      await this.revalidate();
    }

    const flag = this.flags.get(flagId);
    if (!flag) return false;

    const envEnabled = flag.environments?.[this.environment] !== undefined
      ? flag.environments[this.environment]
      : flag.enabled;

    if (!envEnabled) return false;

    if (flag.percentage !== undefined && flag.percentage !== null) {
      const key = userKey || 'anonymous';
      let hash = 0;
      const str = `${flagId}:${key}`;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return (Math.abs(hash) % 100) < flag.percentage;
    }

    return true;
  }

  public async revalidate(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/flags`);
      if (res.ok) {
        const list: EdgeFlag[] = await res.json();
        this.flags.clear();
        for (const f of list) {
          this.flags.set(f.id, f);
        }
        this.lastFetched = Date.now();
      }
    } catch {}
  }
}
