package io.github.authoritydmc.flagslocal;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to guard method execution behind a feature flag.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface FeatureGate {
    /**
     * The feature flag key/id.
     */
    String value();

    /**
     * Fallback method name within the same bean to invoke if the flag is disabled.
     */
    String fallbackMethod() default "";

    /**
     * Default state if flag is not found.
     */
    boolean fallback() default false;
}
