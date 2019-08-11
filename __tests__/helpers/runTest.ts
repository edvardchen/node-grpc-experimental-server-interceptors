import { UntypedServiceImplementation, Client, ServerCredentials, credentials } from 'grpc';
import ExperimentalServer from '../../packages/grpc-experimental-server';
import {
  RouteGuideService,
  RouteGuideClient,
  // @ts-ignore
} from '../fixtures/static_codegen/route_guide_grpc_pb';

// method hubs
import getFeature from '../fixtures/RouteGuide/getFeature';
import recordRoute from '../fixtures/RouteGuide/recordRoute';
import routeChat from '../fixtures/RouteGuide/routeChat';
import listFeatures from '../fixtures/RouteGuide/listFeatures';

export default function runTest({
  implementations,
  testcase,
}: {
  implementations?: UntypedServiceImplementation;
  testcase: (getServer: () => ExperimentalServer, getClient: () => Client) => void;
}): void {
  let server: ExperimentalServer;
  let client: Client;
  beforeAll(done => {
    const port = Math.floor(Math.random() * 1e4);
    server = new ExperimentalServer();

    server.addService(RouteGuideService, {
      getFeature,
      recordRoute,
      listFeatures,
      routeChat,
      ...implementations,
    });

    server.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), error => {
      if (error) {
        return done(error);
      }
      server.start();

      client = new RouteGuideClient(`0.0.0.0:${port}`, credentials.createInsecure());

      done();
    });
  });

  afterAll(done => {
    server.tryShutdown(done);
  });

  testcase(() => server, () => client);
}
