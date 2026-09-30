export interface FlagRule {
  attribute: string; // e.g., "userId", "email", "role", "country"
  operator: 'equals' | 'contains' | 'in' | 'greaterThan' | 'lessThan' | 'percentage';
  value: any;
}

export interface FeatureFlag {
  id: string; // key e.g. "new-checkout"
  name: string;
  description?: string;
  enabled: boolean;
  value?: any; // boolean or dynamic JSON value (strings, numbers, config objects)
  percentage?: number; // 0 to 100
  environments: Record<string, boolean>; // { "development": true, "production": false }
  rules?: FlagRule[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationContext {
  key?: string; // unique user identifier
  attributes?: Record<string, any>;
  environment?: string;
}

export interface EvaluationResult {
  flag: string;
  enabled: boolean;
  value: any;
  reason: string;
}
