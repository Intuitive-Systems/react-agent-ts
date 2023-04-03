// traceUtils.ts
import { context, trace, Span } from '@opentelemetry/api';

export function traceMethod(target: any, methodName: string) {
  const originalMethod = target[methodName];

  target[methodName] = function (...args: any[]) {
    const spanName = `${target.constructor.name}.${methodName}`;
    const span: Span = trace.getTracer('base-class-tracer').startSpan(spanName);
    const spanContext = trace.setSpan(context.active(), span);
    console.log(`[DEBUG] Started span: ${spanName}`); // Debugging


    try {
      // Use `context.with()` to properly attach the span
      const result = context.with(spanContext, () =>
        originalMethod.apply(this, args)
      );

      span.end();
      console.log(`[DEBUG] Ended span: ${spanName}`); // Debugging

      return result;
    } catch (err) {
      span.recordException(err);
      span.end();
      throw err;
    }
  };
}