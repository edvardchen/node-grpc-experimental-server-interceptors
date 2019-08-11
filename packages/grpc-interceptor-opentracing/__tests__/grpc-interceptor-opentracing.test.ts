import { Metadata } from 'grpc';
import { initTracer } from 'jaeger-client';
import { Span, FORMAT_HTTP_HEADERS } from 'opentracing';

import grpcInterceptorOpentracing from '../src';
import runTest from '../../../__tests__/helpers/runTest';
import { Point } from '../../../__tests__/fixtures/static_codegen/route_guide_pb';

describe('grpc-interceptor-opentracing', () => {
  const tracer = initTracer({ serviceName: 'grpc-exp-server' }, {});

  describe('start span witout parent', () => {
    runTest({
      testcase(getServer, client) {
        it('report span on finished', done => {
          const server = getServer();
          server.use(grpcInterceptorOpentracing());
          server.use(async ({ call }, next) => {
            const span = call.span as Span;
            expect(span).toBeInstanceOf(Span);
            span.finish = done;
            await next();
          });

          // @ts-ignore
          client().getFeature(new Point(), () => {});
        });
      },
    });
  });

  describe('start span with parent', () => {
    runTest({
      testcase(getServer, client) {
        it('chain on parent', done => {
          const metadata = new Metadata();
          const prx = new Proxy(metadata, {
            set(target, key: string, value) {
              target.set(key, value);
              return true;
            },
          });
          const clientSpan = tracer.startSpan('test');
          tracer.inject(clientSpan, FORMAT_HTTP_HEADERS, prx);

          const server = getServer();

          server.use(async ({ call }, next) => {
            await next();

            const { span } = call;
            expect(span).not.toBeUndefined();

            const context = (span as Span).context();
            // @ts-ignore
            const { parentIdStr } = context;
            // @ts-ignore
            const { spanIdStr } = clientSpan.context();

            // not empty
            expect(parentIdStr).toEqual(spanIdStr);

            done();
          });
          server.use(grpcInterceptorOpentracing({ tracer }));

          // @ts-ignore
          client().getFeature(new Point(), metadata, () => {});
        });
      },
    });
  });
});
