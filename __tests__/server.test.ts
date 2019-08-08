import ExperimentalServer, { Interceptor } from '../src/server';
import {
  RouteGuideService,
  RouteGuideClient,
} from './fixtures/static_codegen/route_guide_grpc_pb';

import {
  ServerCredentials,
  Client,
  credentials,
  UntypedServiceImplementation,
  handleUnaryCall,
  ServiceError,
  status,
} from 'grpc';
import { Point, Feature } from './fixtures/static_codegen/route_guide_pb';
import getFeature from './fixtures/RouteGuide/getFeature';
import recordRoute from './fixtures/RouteGuide/recordRoute';
import routeChat from './fixtures/RouteGuide/routeChat';
import listFeatures from './fixtures/RouteGuide/listFeatures';

function runTest({
  implementations,
  testcase,
}: {
  implementations: UntypedServiceImplementation;
  testcase: (
    getServer: () => ExperimentalServer,
    getClient: () => Client
  ) => void;
}): void {
  let server: ExperimentalServer;
  let client: Client;
  beforeAll(done => {
    const port = Math.floor(Math.random() * 1e4);
    console.log(port);
    server = new ExperimentalServer();

    server.addService(RouteGuideService, {
      getFeature,
      recordRoute,
      listFeatures,
      routeChat,
      ...implementations,
    });

    server.bindAsync(
      `0.0.0.0:${port}`,
      ServerCredentials.createInsecure(),
      error => {
        if (error) {
          return done(error);
        }
        server.start();

        client = new RouteGuideClient(
          `0.0.0.0:${port}`,
          credentials.createInsecure()
        );

        done();
      }
    );
  });

  afterAll(done => {
    server.tryShutdown(done);
  });

  testcase(() => server, () => client);
}

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
