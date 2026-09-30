import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { FlagsLocalClient, ClientConfig, UserContext } from '@authoritydmc/flags-client';

interface FlagsNativeContextValue {
  client: FlagsLocalClient;
  userContext: UserContext;
}

const FlagsNativeContext = createContext<FlagsNativeContextValue | null>(null);

export interface FlagsNativeProviderProps {
  config: ClientConfig;
  userContext?: UserContext;
  children: React.ReactNode;
}

export const FlagsNativeProvider: React.FC<FlagsNativeProviderProps> = ({
  config,
  userContext = {},
  children
}) => {
  const [client] = useState<FlagsLocalClient>(() => new FlagsLocalClient({ ...config, autoStream: false }));

  useEffect(() => {
    // Initial fetch on mount
    client.fetchFlags();

    // Re-fetch automatically when app returns from background to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        client.fetchFlags();
      }
    });

    return () => {
      subscription.remove();
      client.close();
    };
  }, [client]);

  return React.createElement(
    FlagsNativeContext.Provider,
    { value: { client, userContext } },
    children
  );
};

export function useNativeFlag(flagId: string, fallback: boolean = false): boolean {
  const ctx = useContext(FlagsNativeContext);
  const [enabled, setEnabled] = useState<boolean>(() => {
    return ctx ? ctx.client.isEnabled(flagId, ctx.userContext, fallback) : fallback;
  });

  useEffect(() => {
    if (!ctx) return;
    const update = () => {
      setEnabled(ctx.client.isEnabled(flagId, ctx.userContext, fallback));
    };
    update();
    const unsub = ctx.client.onChange(update);
    return () => unsub();
  }, [ctx, flagId, ctx?.userContext]);

  return enabled;
}

export interface FeatureGateNativeProps {
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGateNative: React.FC<FeatureGateNativeProps> = ({ flag, fallback = null, children }) => {
  const isEnabled = useNativeFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};
