import { Interceptor } from '../src/server';

import { handleUnaryCall, ServiceError, status } from 'grpc';
import { Point, Feature } from './fixtures/static_codegen/route_guide_pb';

import runTest from './helpers/runTest';

describe('server', () => {
  describe('pass through', () => {
    const getFeature: handleUnaryCall<Point, Feature> = (call, callback) => {
      callback(null, new Feature());
    };
    runTest({
      implementations: { getFeature },
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
