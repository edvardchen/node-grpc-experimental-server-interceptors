import compose from 'koa-compose';
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
  ServerWritableStream,
} from 'grpc';
import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Next = (error?: Error) => Promise<any>;

type ServerCall =
  | ServerNonStreamCall
  | ServerWritableStream<unknown>
  | ServerDuplexStream<unknown, unknown>;

type ServerNonStreamCall = ServerUnaryCall<unknown> | ServerReadableStream<unknown>;

// type guard for method definition with property 'originalName'
const isDefinitionWithOriginalName = (def: any): def is { originalName: string } => {
  return (
    !!def &&
    typeof def === 'object' &&
    'originalName' in def &&
    typeof def.originalName === 'string'
  );
};

export class Context {
  response: unknown;
  constructor(public call: ServerCall, public definition: MethodDefinition<unknown, unknown>) {}
  onFinished(listener: (err: Error | null) => void): void {
    const emitter = this.call as EventEmitter;
    emitter.once('finish', listener).once('error', listener);
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

  addService<ImplementationType = UntypedServiceImplementation>(
    service: ServiceDefinition<ImplementationType>,
    implementations: ImplementationType
  ): void {
    const server = this;

    let newImpletations: Partial<ImplementationType> = {};

    for (let key in implementations) {
      const original = implementations[key];
      let def = service[key];
      if (!def) {
        // try to find method definition by original name
        def = Object.values(service).find(
          def => isDefinitionWithOriginalName(def) && def.originalName === key
        );
      }
      // make sure it is method handler
      if (def && def.path && typeof original === 'function') {
        newImpletations = {
          ...newImpletations,
          [key]: server.createHandleCall(original as any, def),
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
    return (call: ServerCall, grpcCallback?: sendUnaryData<unknown>): void => {
      if (!this.handleRequest) throw new Error("gRPC server hanven't start");

      const ctx = new Context(call, definition);

      let handled = false;
      this.handleRequest(ctx, async () => {
        handled = true;
        // unary call
        if (grpcCallback) {
          const nonStreamCall = call as ServerNonStreamCall;
          return new Promise((resolve, reject) => {
            const callback: sendUnaryData<unknown> = (error, value, ...rest) => {
              if (error) {
                grpcCallback(error, value);
                reject(error);
                (call as EventEmitter).emit('finish', error);
                return;
              }

              // REAL SEND RESPONSE
              grpcCallback(null, value, ...rest);
              ctx.response = value;
              resolve();
              (call as EventEmitter).emit('finish');
            };
            // @ts-ignore
            original(nonStreamCall, callback);
          });
        }

        // server stream request
        // @ts-ignore
        original(call);
      }).catch(e => {
        // error happened before processing
        if (!handled) {
          if (grpcCallback) {
            // @ts-ignore
            grpcCallback(e);
          } else {
            (call as ServerWritableStream<unknown>).emit('error', e);
          }
        }
        // ignore post-process error
      });
    };
  }

  protected handleError(call: unknown, error: Error): void {
    (call as EventEmitter).emit('error', error);
  }
}
