import { Interceptor } from '../src/server';

import {
  ServerUnaryCall,
  sendUnaryData,
  handleUnaryCall,
  ServerWriteableStream,
  ServiceError,
  status,
} from 'grpc';
import {
  Point,
  Feature,
  Rectangle,
} from './fixtures/static_codegen/route_guide_pb';

import runTest from './helpers/runTest';

describe('server', () => {
  describe('pass through', () => {
    runTest({
      implementations: {
        getFeature(
          call: ServerUnaryCall<Point>,
          callback: sendUnaryData<Feature>
        ) {
          callback(null, new Feature());
          return new Promise(resolve => setTimeout(resolve, 30000));
        },
        listFeatures(call: ServerWriteableStream<Feature>) {
          call.end();
          return new Promise(resolve => setTimeout(resolve, 30000));
        },
      },
      testcase(server, client) {
        describe('should not timeout', () => {
          it('getFeature', done => {
            // @ts-ignore
            client().getFeature(new Point(), done);
          });

          it('listFeatures', done => {
            server().use(async (ctx, next) => {
              await next();
              done();
            });
            // @ts-ignore
            client().listFeatures(new Rectangle());
          });
        });
      },
    });

    runTest({
      testcase(getServer, getClient) {
        it('getFeature', done => {
          const server = getServer();
          const interceptor: Interceptor = (ctx, next) => {
            next().then(response => {
              expect(response).toBeInstanceOf(Feature);
              done();
            }, done);
          };

          server.use(interceptor);

          const client = getClient();
          // @ts-ignore
          client.getFeature(new Point(), () => {});
          // @ts-ignore
          client.getFeature(new Point(), () => {});
        });
      },
    });
  });

  describe('capture error', () => {
    const getFeature: handleUnaryCall<Point, Feature> = (call, callback) => {
      const error: ServiceError = new Error('unexpected');
      error.code = status.PERMISSION_DENIED;
      callback(error, new Feature());
    };

    runTest({
      implementations: { getFeature },
      testcase(server, client) {
        it('getFeature', done => {
          const interceptor: Interceptor = (ctx, next) => {
            next().catch(e => {
              expect(e.code).toEqual(status.PERMISSION_DENIED);
              expect(e.message).toEqual('unexpected');
              done();
            });
          };

          server().use(interceptor);

          // @ts-ignore
          client().getFeature(new Point(), () => {});
        });
      },
    });
  });
});
