import { ServerWritableStream, MethodDefinition, ServerUnaryCall } from 'grpc';
import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Next = (error?: Error) => Promise<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerCall = ServerUnaryCall<any> | ServerWritableStream<any>;

export class Context {
  response: unknown;
  constructor(public call: ServerCall, public definition: MethodDefinition<unknown, unknown>) {}
  onFinished(listener: (err: Error | null) => void): void {
    const emitter = this.call as EventEmitter;
    emitter.once('finish', listener).once('error', listener);
  }
}

export type Interceptor = (ctx: Context, next: Next) => Promise<void>;
