import React, { createContext, useContext, useEffect, useState } from 'react';
import { FlagsLocalClient, ClientConfig, UserContext } from '@authoritydmc/flags-client';

interface FlagsContextValue {
  client: FlagsLocalClient;
  userContext: UserContext;
}

const FlagsContext = createContext<FlagsContextValue | null>(null);

export interface FlagsProviderProps {
  config?: ClientConfig;
  userContext?: UserContext;
  client?: FlagsLocalClient;
  children: React.ReactNode;
}

export const FlagsProvider: React.FC<FlagsProviderProps> = ({
  config,
  userContext = {},
  client: customClient,
  children
}) => {
  const [client] = useState<FlagsLocalClient>(() => customClient || new FlagsLocalClient(config));

  return React.createElement(
    FlagsContext.Provider,
    { value: { client, userContext } },
    children
  );
};

export function useFlag(flagId: string, fallback: boolean = false): boolean {
  const ctx = useContext(FlagsContext);
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

export interface FeatureGateProps {
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ flag, fallback = null, children }) => {
  const isEnabled = useFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};
