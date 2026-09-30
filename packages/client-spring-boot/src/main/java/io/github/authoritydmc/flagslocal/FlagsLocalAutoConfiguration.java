package io.github.authoritydmc.flagslocal;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@AutoConfiguration
@EnableConfigurationProperties(FlagsLocalProperties.class)
@EnableAspectJAutoProxy
public class FlagsLocalAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public FlagsLocalService flagsLocalService(FlagsLocalProperties properties) {
        return new FlagsLocalService(properties);
    }

    @Bean
    @ConditionalOnMissingBean
    public FeatureGateAspect featureGateAspect(FlagsLocalService flagsLocalService) {
        return new FeatureGateAspect(flagsLocalService);
    }
}
