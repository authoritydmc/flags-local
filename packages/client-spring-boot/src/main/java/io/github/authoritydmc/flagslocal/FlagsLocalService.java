package io.github.authoritydmc.flagslocal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to query and evaluate feature flags.
 */
public class FlagsLocalService {

    private final FlagsLocalProperties properties;
    private final Map<String, Boolean> flagCache = new ConcurrentHashMap<>();

    public FlagsLocalService(FlagsLocalProperties properties) {
        this.properties = properties;
        if (properties.getDefaults() != null) {
            flagCache.putAll(properties.getDefaults());
        }
    }

    /**
     * Check if a feature flag is enabled for the default context.
     *
     * @param flagId the flag key
     * @return true if enabled
     */
    public boolean isEnabled(String flagId) {
        return isEnabled(flagId, null, null);
    }

    /**
     * Check if a feature flag is enabled for a given user key with percentage rollout.
     *
     * @param flagId  the flag key
     * @param userKey unique user key
     * @return true if enabled
     */
    public boolean isEnabled(String flagId, String userKey) {
        return isEnabled(flagId, userKey, null);
    }

    /**
     * Check if a feature flag is enabled with user key and fallback.
     *
     * @param flagId   the flag key
     * @param userKey  unique user key
     * @param fallback default value if flag is not configured
     * @return true if enabled
     */
    public boolean isEnabled(String flagId, String userKey, Boolean fallback) {
        if (!flagCache.containsKey(flagId)) {
            return fallback != null ? fallback : false;
        }
        return flagCache.getOrDefault(flagId, false);
    }

    /**
     * Update flag state in runtime cache.
     *
     * @param flagId the flag key
     * @param state  enabled state
     */
    public void setFlag(String flagId, boolean state) {
        flagCache.put(flagId, state);
    }

    /**
     * Evaluate percentage rollout hash.
     *
     * @param flagId     the flag key
     * @param userKey    the user key
     * @param percentage percentage threshold (0-100)
     * @return true if user falls within rollout percentage
     */
    public boolean evaluatePercentage(String flagId, String userKey, int percentage) {
        if (percentage <= 0) return false;
        if (percentage >= 100) return true;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((flagId + ":" + (userKey != null ? userKey : "anonymous")).getBytes(StandardCharsets.UTF_8));
            int val = ((hash[0] & 0xFF) << 24) | ((hash[1] & 0xFF) << 16) | ((hash[2] & 0xFF) << 8) | (hash[3] & 0xFF);
            int bucket = Math.abs(val) % 100;
            return bucket < percentage;
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
    }
}
