import {
  Server,
  UntypedServiceImplementation,
  ServiceDefinition,
  sendUnaryData,
  handleCall,
  MethodDefinition,
  ServerReadableStream,
  ServerDuplexStream,
  ServerUnaryCall,
} from 'grpc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Next = (error?: Error) => Promise<any>;

type ServerCall =
  | ServerUnaryCall<unknown>
  | ServerReadableStream<unknown>
  | ServerReadableStream<unknown>
  | ServerDuplexStream<unknown, unknown>;

export type Context = {
  call: ServerCall;
  definition: MethodDefinition<unknown, unknown>;
};

export type Interceptor = (ctx: Context, next: Next) => void;

export default class ExperimentalServer extends Server {
  protected interceptors: Interceptor[] = [];

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
    return (call: ServerCall, grpcCallback: unknown): void => {
      const ctx: Context = { call, definition };
      const interceptors = this.intercept();

      // start to run interceptors
      const { value: first } = interceptors.next();
      if (!first) {
        // no interceptors
        // @ts-ignore
        original(call, grpcCallback);
        return;
      }

      first(ctx, function next() {
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
          original(call);
          return;
        }
        // run another interceptor
        return value(ctx, next);
      });
    };
  }

  use(fn: Interceptor): void {
    this.interceptors.push(fn);
  }

  protected *intercept(): Generator {
    let i = 0;
    while (i < this.interceptors.length) {
      yield this.interceptors[i];
      i++;
    }
  }
}
