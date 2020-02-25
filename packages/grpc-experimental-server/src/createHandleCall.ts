import {
  MethodDefinition,
  handleCall,
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
} from 'grpc';
import { Interceptor, ServerCall, Context } from './types';
import { EventEmitter } from 'events';

/**
 *  wrap original handler with interceptors
 */
export default function createHandleCall(
  original: handleCall<unknown, unknown>,
  definition: MethodDefinition<unknown, unknown>,
  interceptor?: Interceptor
) {
  if (!interceptor) return original;

  return (call: ServerCall, grpcCallback?: sendUnaryData<unknown>): void => {
    const ctx = new Context(call, definition);

    // indicated if request had beed handled
    let handled = false;
    interceptor(ctx, async () => {
      // the real business process

      handled = true;
      // unary call
      if (grpcCallback) {
        const nonStreamCall = call as ServerUnaryCall<unknown>;
        return new Promise(resolve => {
          const callback: sendUnaryData<unknown> = (error, value, ...rest) => {
            // REAL SEND RESPONSE
            grpcCallback(error, value, ...rest);
            ctx.error = error;
            ctx.response = value;
            // always resolve
            resolve();
            // always emit finish
            (call as EventEmitter).emit('finish', error);
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
        return;
      }

      // just ignore because request had been handled
      // eslint-disable-next-line no-console
      console.log('Unhandled rejection occurred during post-processing', e);
    });
  };
}
