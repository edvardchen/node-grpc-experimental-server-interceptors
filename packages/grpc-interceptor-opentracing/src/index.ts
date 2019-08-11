import { Tracer, globalTracer, FORMAT_HTTP_HEADERS, Span, Tags } from 'opentracing';
import { Interceptor } from 'ges';

declare module 'grpc' {
  interface ServerUnaryCall<RequestType> {
    span?: Span;
  }
  interface ServerWriteableStream<RequestType> {
    span?: Span;
  }
  interface ServerReadableStream<RequestType> {
    span?: Span;
  }
  interface ServerDuplexStream<RequestType, ResponseType> {
    span?: Span;
  }
}

/** opentracing interceptor
 * extract parent span from metadata and chian on it
 * @param {Tracer} [tracer] If omitted, global tracer would be used
 */
export default function opentracing(options?: { tracer?: Tracer }): Interceptor {
  return async (ctx, next) => {
    const {
      call,
      definition: { path },
    } = ctx;
    const tracer = (options && options.tracer) || globalTracer();

    const { metadata } = call;

    const parent = tracer.extract(FORMAT_HTTP_HEADERS, metadata.getMap());

    const span = tracer.startSpan(path, parent ? { childOf: parent } : undefined);

    // expose span
    call.span = span;

    ctx.onFinished((error: Error | null) => {
      if (error) {
        span.addTags({
          [Tags.ERROR]: error,
        });
      }
      span.finish();
    });

    await next();
  };
}
