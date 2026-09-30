import { ref, onMounted, onUnmounted, defineComponent, h, PropType } from 'vue';
import { FlagsLocalClient, ClientConfig, UserContext } from '@authoritydmc/flags-client';

let globalClient: FlagsLocalClient | null = null;

export function initFlags(config: ClientConfig): FlagsLocalClient {
  globalClient = new FlagsLocalClient(config);
  return globalClient;
}

export function useFlag(flagId: string, userContext?: UserContext, fallback: boolean = false) {
  const isEnabled = ref<boolean>(fallback);

  const update = () => {
    if (globalClient) {
      isEnabled.value = globalClient.isEnabled(flagId, userContext, fallback);
    }
  };

  onMounted(() => {
    update();
    if (globalClient) {
      const unsub = globalClient.onChange(update);
      onUnmounted(() => unsub());
    }
  });

  return isEnabled;
}

export const FeatureGate = defineComponent({
  name: 'FeatureGate',
  props: {
    flag: {
      type: String,
      required: true
    },
    userContext: {
      type: Object as PropType<UserContext>,
      default: () => ({})
    },
    fallback: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    const isEnabled = useFlag(props.flag, props.userContext, props.fallback);

    return () => {
      if (isEnabled.value) {
        return slots.default ? slots.default() : null;
      }
      return slots.fallback ? slots.fallback() : null;
    };
  }
});
