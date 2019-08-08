import {
  Server,
  UntypedServiceImplementation,
  ServiceDefinition,
  sendUnaryData,
  handleCall,
  MethodDefinition,
} from 'grpc';

type Next = (error?: Error) => Promise<any>;

export type Context = {
  call: unknown;
  definition: MethodDefinition<unknown, unknown>;
};

export type Interceptor = (ctx: Context, next: Next) => void;

export default class ExperimentalServer extends Server {
  interceptors: Interceptor[] = [];

  // @ts-ignore
  addService<ImplementationType extends UntypedServiceImplementation>(
    service: ServiceDefinition<ImplementationType>,
    implementations: ImplementationType
  ): void {
    const server = this;

    // @ts-ignore
    const newImpletations: ImplementationType = {};

    Object.keys(implementations).forEach(key => {
      const original = implementations[key];
      const def = service[key];

      // make sure it is method handler
      if (def && def.path && typeof original === 'function') {
        // @ts-ignore
        newImpletations[key] = server.createHandleCall(original, def);
      }
    });

    super.addService<ImplementationType>(service, newImpletations);
  }

  createHandleCall(
    original: handleCall<unknown, unknown>,
    definition: MethodDefinition<unknown, unknown>
  ) {
    return (call: unknown, grpcCallback: unknown): void => {
      const ctx: Context = { call, definition };
      const interceptors = this.intercept();

      // start to run interceptors
      const { value: first } = interceptors.next();
      if (!first) {
        // no interceptors
        // @ts-ignore
        return original(call, grpcCallback);
      }

      first(ctx, async function next() {
        const { done, value } = interceptors.next();
        if (done) {
          // unary call
          if (grpcCallback) {
            return new Promise((resolve, reject) => {
              // @ts-ignore
              original(call, (error, response, ...args) => {
                (grpcCallback as sendUnaryData<unknown>)(
                  error,
                  response,
                  ...args
                );
                if (error) {
                  reject(error);
                  return;
                }
                resolve(response);
              });
            });
          }

          // @ts-ignore
          return original(call);
        }
        // run another interceptor
        return value(ctx, next);
      });
    };
  }

  use(fn: Interceptor): void {
    this.interceptors.push(fn);
  }

  *intercept(): Generator {
    let i = 0;
    while (i < this.interceptors.length) {
      yield this.interceptors[i];
      i++;
    }
  }
}
