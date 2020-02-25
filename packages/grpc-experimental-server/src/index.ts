import compose from 'koa-compose';
import {
  Server,
  UntypedServiceImplementation,
  ServiceDefinition,
  handleCall,
  MethodDefinition,
} from 'grpc';
import { Interceptor } from './types';

import createHandleCall from './createHandleCall';

export * from './types';

export { createHandleCall };

export default class ExperimentalServer extends Server {
  protected interceptors: Interceptor[] = [];
  protected handleRequest?: Interceptor;

  start(): void {
    this.handleRequest = compose(this.interceptors);
    super.start();
  }

  addService<ImplementationType = UntypedServiceImplementation>(
    service: ServiceDefinition<ImplementationType>,
    implementations: ImplementationType
  ): void {
    let newImpletations: Partial<ImplementationType> = {};

    for (let key in implementations) {
      const original = implementations[key];
      const def = service[key];
      // make sure it is method handler
      if (def && def.path && typeof original === 'function') {
        newImpletations = {
          ...newImpletations,
          [key]: this.createHandleCall(original as any, def),
        };
      }
    }
    super.addService(service, newImpletations);
  }

  use(fn: Interceptor): void {
    this.interceptors.push(fn);
  }

  protected createHandleCall(
    original: handleCall<unknown, unknown>,
    definition: MethodDefinition<unknown, unknown>
  ) {
    let cached: Function;
    return (call: any, grpcCallback: any) => {
      if (!this.handleRequest) {
        // not happen in real world
        throw new Error("gRPC server haven't start yet");
      }

      if (!cached) {
        cached = createHandleCall(original, definition, this.handleRequest);
      }
      return cached(call, grpcCallback);
    };
  }
}
