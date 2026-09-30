import * as crypto from 'crypto';
import { FeatureFlag, EvaluationContext, EvaluationResult, FlagRule } from './types';

export function hashString(str: string): number {
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return num % 100; // 0..99
}

export function evaluateRule(rule: FlagRule, context: EvaluationContext): boolean {
  const val = context.attributes?.[rule.attribute] ?? (rule.attribute === 'key' ? context.key : undefined);
  if (val === undefined || val === null) return false;

  switch (rule.operator) {
    case 'equals':
      return String(val) === String(rule.value);
    case 'contains':
      return String(val).includes(String(rule.value));
    case 'in':
      if (Array.isArray(rule.value)) {
        return rule.value.map(String).includes(String(val));
      }
      return false;
    case 'greaterThan':
      return Number(val) > Number(rule.value);
    case 'lessThan':
      return Number(val) < Number(rule.value);
    case 'percentage':
      const hashVal = hashString(`${context.key || val}`);
      return hashVal < Number(rule.value);
    default:
      return false;
  }
}

export function evaluateFlag(flag: FeatureFlag, context: EvaluationContext = {}): EvaluationResult {
  const env = context.environment || 'development';
  const envEnabled = flag.environments?.[env] !== undefined ? flag.environments[env] : flag.enabled;

  if (!envEnabled) {
    return {
      flag: flag.id,
      enabled: false,
      value: flag.value !== undefined ? flag.value : false,
      reason: `Flag is disabled in environment '${env}'`
    };
  }

  // Evaluate explicit rules if provided
  if (flag.rules && flag.rules.length > 0) {
    for (const rule of flag.rules) {
      if (evaluateRule(rule, context)) {
        return {
          flag: flag.id,
          enabled: true,
          value: flag.value !== undefined ? flag.value : true,
          reason: `Matched rule for attribute '${rule.attribute}'`
        };
      }
    }
    // If rules exist and none matched, and no percentage fallback
    if (flag.percentage === undefined) {
      return {
        flag: flag.id,
        enabled: false,
        value: flag.value !== undefined ? flag.value : false,
        reason: 'Targeting rules defined but none matched'
      };
    }
  }

  // Evaluate percentage rollout if present
  if (flag.percentage !== undefined && flag.percentage !== null) {
    const key = context.key || 'anonymous';
    const hash = hashString(`${flag.id}:${key}`);
    const isWithinPercentage = hash < flag.percentage;
    return {
      flag: flag.id,
      enabled: isWithinPercentage,
      value: flag.value !== undefined ? flag.value : isWithinPercentage,
      reason: `Percentage rollout (${flag.percentage}%): user hash ${hash}`
    };
  }

  // Default enabled
  return {
    flag: flag.id,
    enabled: true,
    value: flag.value !== undefined ? flag.value : true,
    reason: 'Flag is default enabled'
  };
}
