package io.github.authoritydmc.flagslocal;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.stereotype.Service;

import static org.junit.jupiter.api.Assertions.*;

class FlagsLocalAutoConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(FlagsLocalAutoConfiguration.class));

    @Test
    void testAutoConfigurationLoadsBeans() {
        contextRunner.run(context -> {
            assertTrue(context.containsBean("flagsLocalService"));
            assertTrue(context.containsBean("featureGateAspect"));

            FlagsLocalService service = context.getBean(FlagsLocalService.class);
            assertFalse(service.isEnabled("unknown-flag"));

            service.setFlag("test-flag", true);
            assertTrue(service.isEnabled("test-flag"));

            assertTrue(service.evaluatePercentage("test-flag", "user1", 100));
            assertFalse(service.evaluatePercentage("test-flag", "user1", 0));
        });
    }

    @Test
    void testFeatureGateAspectExecution() {
        contextRunner.withUserConfiguration(TestSampleService.class).run(context -> {
            TestSampleService sampleService = context.getBean(TestSampleService.class);
            FlagsLocalService flagsService = context.getBean(FlagsLocalService.class);

            // Flag is disabled -> should execute fallback
            assertEquals("fallback result", sampleService.executeFeature());

            // Enable flag -> should execute primary method
            flagsService.setFlag("sample-feature", true);
            assertEquals("new feature result", sampleService.executeFeature());
        });
    }

    @Service
    static class TestSampleService {

        @FeatureGate(value = "sample-feature", fallbackMethod = "fallbackMethod")
        public String executeFeature() {
            return "new feature result";
        }

        public String fallbackMethod() {
            return "fallback result";
        }
    }
}
