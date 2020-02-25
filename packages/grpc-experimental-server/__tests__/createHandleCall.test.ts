import lodash from 'lodash';
import path from 'path';
import { ServerUnaryCall, status, sendUnaryData, Client, ServiceError } from 'grpc';
import { getClient, startServer, loadPB, mockImplementations } from 'grpc-test-helper';
import { createHandleCall } from '../src';
import { unaryCallThenShutdown } from '../../../__tests__/helpers/runTest';

describe('createHandleCall', () => {
  let client: Client;
  let port: number;
  const pbFile = path.resolve(__dirname, '../../../__tests__/fixtures/protos/route_guide.proto');
  const pkgDef = loadPB(pbFile);
  const serviceName = 'routeguide.RouteGuide';

  // @ts-ignore
  const defaultImplements = mockImplementations(lodash.get(pkgDef, serviceName).service);

  beforeAll(() => {
    port = Math.floor(Math.random() * 1e4);
    client = getClient(pbFile, serviceName, port);
  });

  afterAll(() => {
    client.close();
  });

  it('interceptor missing', () => {
    expect(
      createHandleCall(
        defaultImplements.GetFeature,
        // @ts-ignore
        pkgDef.routeguide.RouteGuide
      )
    ).toEqual(defaultImplements.GetFeature);
  });

  it('should not timeout', async () => {
    const server = startServer(pbFile, serviceName, port, {
      GetFeature: createHandleCall(
        defaultImplements.GetFeature,
        // @ts-ignore
        pkgDef.routeguide.RouteGuide,
        async (ctx, next) => {
          await next();
        }
      ),
    });
    await unaryCallThenShutdown(client, server, 'getFeature');
  });
  describe('on finished', () => {
    it('blank', async () => {
      let finished = false;
      const server = startServer(pbFile, serviceName, port, {
        GetFeature: createHandleCall(
          defaultImplements.GetFeature,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            ctx.onFinished(() => {
              finished = true;
            });
            await next();
          }
        ),
      });
      await unaryCallThenShutdown(client, server, 'getFeature');
      expect(finished).toBe(true);
    });
    it('capture error', async () => {
      let finished = false;
      let caughtError;
      const server = startServer(pbFile, serviceName, port, {
        GetFeature: createHandleCall(
          (call: ServerUnaryCall<unknown>, callback: sendUnaryData<unknown>) => {
            callback(new Error('hell'), {});
          },
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            ctx.onFinished(error => {
              finished = true;
              caughtError = error;
            });
            await next();
          }
        ),
      });
      await expect(unaryCallThenShutdown(client, server, 'getFeature')).rejects.toThrow('hell');
      expect(finished).toBe(true);
      expect(caughtError).toBeInstanceOf(Error);
    });
  });

  describe('post-process', () => {
    it('should get Feature', async () => {
      const server = startServer(pbFile, serviceName, port, {
        GetFeature: createHandleCall(
          defaultImplements.GetFeature,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            await next();
            expect(ctx.response).toBeDefined();
          }
        ),
      });

      await unaryCallThenShutdown(client, server, 'getFeature');
    });
  });

  describe('capture pre-process error', () => {
    it('unary', async () => {
      const server = startServer(pbFile, serviceName, port, {
        GetFeature: createHandleCall(
          defaultImplements.GetFeature,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            throw new Error('pre-process');
          }
        ),
      });
      await expect(unaryCallThenShutdown(client, server, 'getFeature')).rejects.toThrow(
        'pre-process'
      );
    });

    it('server stream', done => {
      const server = startServer(pbFile, serviceName, port, {
        ListFeatures: createHandleCall(
          defaultImplements.ListFeatures,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            throw new Error('pre-process');
          }
        ),
      });
      // @ts-ignore
      const call = client.listFeatures({}) as ClientReadableStream<Feature>;

      // trigger client to read stream
      call.on('data', () => {});
      call.on('error', (e: any) => {
        expect(e.details).toEqual('pre-process');
        server.tryShutdown(done);
      });
    });
  });

  describe('ignore post-process error', () => {
    it('', async () => {
      const server = startServer(pbFile, serviceName, port, {
        GetFeature: createHandleCall(
          defaultImplements.GetFeature,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            await next();
            throw new Error('post-process');
          }
        ),
        ListFeatures: createHandleCall(
          defaultImplements.ListFeatures,
          // @ts-ignore
          pkgDef.routeguide.RouteGuide,
          async (ctx, next) => {
            await next();
            throw new Error('post-process');
          }
        ),
      });

      await new Promise(resolve => {
        // @ts-ignorewai
        const call = client.listFeatures({}) as ClientReadableStream<Feature>;

        // trigger client to read stream
        call.on('data', () => {});
        call.on('end', resolve);
      });

      await unaryCallThenShutdown(client, server, 'getFeature');
    });
  });
});
