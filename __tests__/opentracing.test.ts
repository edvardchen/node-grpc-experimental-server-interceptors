import { initTracer } from 'jaeger-client';
import runTest from './helpers/runTest';
import { Metadata } from 'grpc';
import { opentracing } from '../src';
import { Span, FORMAT_HTTP_HEADERS } from 'opentracing';
import { Point } from './fixtures/static_codegen/route_guide_pb';

describe('opentracing', () => {
  const tracer = initTracer({ serviceName: 'grpc-exp-server' }, {});

  describe('start span', () => {
    runTest({
      testcase(getServer, client) {
        it('without parent', done => {
          const server = getServer();
          server.use(opentracing());

          server.use(async ({ call: { span } }, next) => {
            expect(span).toBeInstanceOf(Span);
            await next();
            done();
          });

          // @ts-ignore
          client().getFeature(new Point(), () => {});
        });
      },
    });
  });

  describe('start span ', () => {
    runTest({
      testcase(getServer, client) {
        it('with parent', done => {
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
          server.use(opentracing({ tracer }));

          server.use(async ({ call: { span } }, next) => {
            expect(span).not.toBeUndefined();

            const context = (span as Span).context();
            // @ts-ignore
            const { parentIdStr } = context;
            // @ts-ignore
            const { spanIdStr } = clientSpan.context();

            // not empty
            expect(parentIdStr).toEqual(spanIdStr);

            await next();
            done();
          });

          // @ts-ignore
          client().getFeature(new Point(), metadata, () => {});
        });
      },
    });
  });
});
