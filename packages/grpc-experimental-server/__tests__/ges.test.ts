import path from 'path';
import { ClientReadableStream } from 'grpc';
import { getClient } from 'grpc-test-helper';
import { startGes, unaryCallThenShutdown } from '../../../__tests__/helpers/runTest';
import { Interceptor } from '../src/types';

describe('ges', () => {
  const pbFile = path.resolve(__dirname, '../../../__tests__/fixtures/protos/route_guide.proto');
  const serviceName = 'routeguide.RouteGuide';

  it('init ges', async () => {
    let run = false;
    const { server, port } = startGes({
      PBFile: pbFile,
      serviceName,
      interceptors: [
        (async (ctx, next) => {
          run = true;
          await next();
        }) as Interceptor,
      ],
    });

    const client = getClient(pbFile, serviceName, port);

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
