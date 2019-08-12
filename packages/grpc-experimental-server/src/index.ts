import compose from 'koa-compose';
import {
  Metadata,
  Server,
  UntypedServiceImplementation,
  ServiceDefinition,
  sendUnaryData,
  handleCall,
  MethodDefinition,
  ServerReadableStream,
  ServerWriteableStream,
  ServerDuplexStream,
  ServerUnaryCall,
} from 'grpc';
import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Next = (error?: Error) => Promise<any>;

type ServerCall =
  | ServerNonStreamCall
  | ServerWriteableStream<unknown>
  | ServerDuplexStream<unknown, unknown>;

type ServerNonStreamCall = ServerUnaryCall<unknown> | ServerReadableStream<unknown>;

export class Context {
  response: {
    value?: unknown;
    trailer?: Metadata;
    flags?: number;
  } = {};
  constructor(public call: ServerCall, public definition: MethodDefinition<unknown, unknown>) {}
  onFinished(listener: (err: Error | null) => void): void {
    const emitter = this.call as EventEmitter;
    emitter.on('finish', listener).on('error', listener);
  }
}

export type Interceptor = (ctx: Context, next: Next) => Promise<void>;

export default class ExperimentalServer extends Server {
  protected interceptors: Interceptor[] = [];
  protected handleRequest?: Interceptor;

  start(): void {
    this.handleRequest = compose(this.interceptors);
    super.start();
  }

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

  use(fn: Interceptor): void {
    this.interceptors.push(fn);
  }

  protected createHandleCall(
    original: handleCall<unknown, unknown>,
    definition: MethodDefinition<unknown, unknown>
  ) {
    return (call: ServerCall, grpcCallback?: sendUnaryData<unknown>): void => {
      if (!this.handleRequest) throw new Error("gRPC server hanven't start");

      const ctx = new Context(call, definition);

      const pending = this.handleRequest(ctx, async () => {
        // unary call
        if (grpcCallback) {
          const nonStreamCall = call as ServerNonStreamCall;
          return new Promise((resolve, reject) => {
            const callback: sendUnaryData<unknown> = (error, value, trailer, flags) => {
              if (error) return reject(error);
              ctx.response = { ...ctx.response, value, trailer, flags };
              resolve();
            };
            // @ts-ignore
            original(nonStreamCall, callback);
          });
        }

        // @ts-ignore
        original(call);
        return;
      });
      if (grpcCallback) {
        pending
          .then(() => {
            const {
              response: { value, trailer, flags },
            } = ctx;
            // real send response
            grpcCallback(null, value, trailer, flags);
            (call as EventEmitter).emit('finish');
          })
          .catch(error => {
            grpcCallback(error, null);
            (call as EventEmitter).emit('finish', error);
          });
      }
    };
  }

  protected handleError(call: unknown, error: Error): void {
    (call as EventEmitter).emit('error', error);
  }
}
