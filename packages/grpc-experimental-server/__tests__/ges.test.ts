import lodash from 'lodash';
import path from 'path';
import { ServerUnaryCall, sendUnaryData, Client, ClientReadableStream } from 'grpc';
import { getClient, startServer, loadPB, mockImplementations } from 'grpc-test-helper';
import ExperimentalServer from '../src';
import { Server } from 'grpc';
import { ServerCredentials } from 'grpc';

describe('ges', () => {
  let client: Client;
  let port: number;
  const pbFile = path.resolve(__dirname, '../../../__tests__/fixtures/protos/route_guide.proto');
  const pkgDef = loadPB(pbFile);
  const serviceName = 'routeguide.RouteGuide';
  beforeAll(() => {
    port = Math.floor(Math.random() * 1e4);
    client = getClient(pbFile, serviceName, port);
  });

  afterAll(() => {
    client.close();
  });

  function unaryCallThenShutdown(client: any, server: Server, method: string) {
    return new Promise((resolve, reject) => {
      client[method]({}, (error: Error, payload: any) => {
        server.tryShutdown(() => {
          if (error) return reject(error);
          resolve(payload);
        });
      });
    });
  }

  it('init ges', async () => {
    const server = new ExperimentalServer();
    const serviceDef = lodash.get(pkgDef, 'routeguide.RouteGuide.service') as any;
    let run = false;
    server.use(async (ctx, next) => {
      run = true;
      await next();
    });
    server.addService(serviceDef, mockImplementations(serviceDef));

    server.bind(`localhost:${port}`, ServerCredentials.createInsecure());

    server.start();

    await new Promise(resolve => {
      const call = (client as any).listFeatures({}) as ClientReadableStream<unknown>;
      call.on('data', () => {});
      call.on('end', resolve);
    });
    expect(run).toBe(true);

    await new Promise(resolve => {
      const call = (client as any).listFeatures({}) as ClientReadableStream<unknown>;
      call.on('data', () => {});
      call.on('end', resolve);
    });

    await unaryCallThenShutdown(client, server, 'getFeature');
  });
});
