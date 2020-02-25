import lodash from 'lodash';
import { UntypedServiceImplementation, Server, ServiceDefinition, ServerCredentials } from 'grpc';
import ExperimentalServer, { Interceptor } from '../../packages/grpc-experimental-server/src';
import { loadPB, randomPort, mockImplementations } from 'grpc-test-helper';

export function startGes({
  PBFile,
  serviceName,
  port = randomPort(),
  implementations,
  interceptors = [],
}: {
  PBFile: string;
  serviceName: string;
  port?: number;
  implementations?: UntypedServiceImplementation;
  interceptors?: Interceptor[];
}) {
  const server = new ExperimentalServer();
  const pkgDef = loadPB(PBFile);
  const Service = lodash.get(pkgDef, `${serviceName}.service`) as ServiceDefinition<any>;

  server.addService(Service, {
    ...mockImplementations(Service, implementations),
  });

  interceptors.forEach(item => server.use(item));

  const address = `localhost:${port}`;
  const bound = server.bind(address, ServerCredentials.createInsecure());
  if (!bound) throw new Error('serer start failed');
  server.start();
  return { server, port };
}

export function unaryCallThenShutdown(client: any, server: Server, method: string) {
  return new Promise((resolve, reject) => {
    client[method]({}, (error: Error, payload: any) => {
      server.tryShutdown(() => {
        if (error) return reject(error);
        resolve(payload);
      });
    });
  });
}
