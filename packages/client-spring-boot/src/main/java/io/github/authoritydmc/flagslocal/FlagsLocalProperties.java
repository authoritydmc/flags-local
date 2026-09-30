package io.github.authoritydmc.flagslocal;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "flags")
public class FlagsLocalProperties {
    private String serverUrl = "http://localhost:4040";
    private String environment = "development";
    private boolean autoSync = true;
    private Map<String, Boolean> defaults = new HashMap<>();

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public boolean isAutoSync() {
        return autoSync;
    }

    public void setAutoSync(boolean autoSync) {
        this.autoSync = autoSync;
    }

    public Map<String, Boolean> getDefaults() {
        return defaults;
    }

    public void setDefaults(Map<String, Boolean> defaults) {
        this.defaults = defaults;
    }
}
