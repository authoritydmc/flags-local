package io.github.authoritydmc.flagslocal;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;

import java.lang.reflect.Method;

/**
 * Aspect to intercept methods annotated with {@link FeatureGate}.
 */
@Aspect
public class FeatureGateAspect {

    private final FlagsLocalService flagsLocalService;

    public FeatureGateAspect(FlagsLocalService flagsLocalService) {
        this.flagsLocalService = flagsLocalService;
    }

    @Around("@annotation(featureGate)")
    public Object checkFeatureGate(ProceedingJoinPoint joinPoint, FeatureGate featureGate) throws Throwable {
        String flagId = featureGate.value();
        boolean isEnabled = flagsLocalService.isEnabled(flagId, null, featureGate.fallback());

        if (isEnabled) {
            return joinPoint.proceed();
        }

        // Handle Fallback method if specified
        if (!featureGate.fallbackMethod().isEmpty()) {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method targetMethod = signature.getMethod();
            Method fallback = joinPoint.getTarget().getClass().getMethod(featureGate.fallbackMethod(), targetMethod.getParameterTypes());
            fallback.setAccessible(true);
            return fallback.invoke(joinPoint.getTarget(), joinPoint.getArgs());
        }

        // Return default null / false / 0 for primitive or void
        Class<?> returnType = ((MethodSignature) joinPoint.getSignature()).getReturnType();
        if (returnType == void.class) return null;
        if (returnType == boolean.class) return false;
        if (returnType == int.class) return 0;
        return null;
    }
}
