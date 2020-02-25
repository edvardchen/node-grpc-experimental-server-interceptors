import { Metadata } from 'grpc';
import path from 'path';
import { initTracer } from 'jaeger-client';
import { Span, FORMAT_HTTP_HEADERS, Tracer } from 'opentracing';
import { loadPB, getClient } from 'grpc-test-helper';

import grpcInterceptorOpentracing from '../src';
import { startGes, unaryCallThenShutdown } from '../../../__tests__/helpers/runTest';

describe('grpc-interceptor-opentracing', () => {
  let tracer: Tracer;
  const PBFile = path.resolve(__dirname, '../../../__tests__/fixtures/protos/route_guide.proto');
  const serviceName = 'routeguide.RouteGuide';

  beforeAll(() => {
    tracer = initTracer({ serviceName: 'grpc-exp-server' }, {});
  });
  afterAll(done => {
    // @ts-ignore
    tracer.close(done);
  });

  describe('start span without parent', () => {
    it('report span on finished', async () => {
      let finished = false;
      const { server, port } = startGes({
        PBFile,
        serviceName,
        interceptors: [
          grpcInterceptorOpentracing(),
          async ({ call }, next) => {
            const span = call.span as Span;
            expect(span).toBeInstanceOf(Span);
            span.finish = () => {
              finished = true;
            };
            await next();
          },
        ],
      });

      const client = getClient(PBFile, serviceName, port);
      await unaryCallThenShutdown(client, server, 'getFeature');
      expect(finished).toBe(true);
    });
  });

  describe.skip('start span with parent', () => {
    it('chain on parent', async () => {
      const metadata = new Metadata();
      const prx = new Proxy(metadata, {
        set(target, key: string, value) {
          target.set(key, value);
          return true;
        },
      });
      const clientSpan = tracer.startSpan('test');
      tracer.inject(clientSpan, FORMAT_HTTP_HEADERS, prx);

      let span: Span | undefined;
      const { server, port } = startGes({
        PBFile,
        serviceName,
        interceptors: [
          async ({ call }, next) => {
            await next();

            span = call.span;
          },
          grpcInterceptorOpentracing({ tracer }),
        ],
      });

      const client = getClient(PBFile, serviceName, port);

      // @ts-ignore
      await new Promise((resolve, reject) => {
        // @ts-ignore
        client.getFeature({}, metadata, error => {
          if (error) return reject(error);
          resolve();
        });
      });

      await new Promise(resolve => server.tryShutdown(resolve));

      expect(span).toBeDefined();

      const context = (span as Span).context();
      // @ts-ignore
      const { parentIdStr } = context;
      // @ts-ignore
      const { spanIdStr } = clientSpan.context();

      // not empty
      expect(parentIdStr).toEqual(spanIdStr);
    });
  });
});
