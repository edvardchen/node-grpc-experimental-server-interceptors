import { handleBidiStreamingCall } from 'grpc';
import { RouteNote } from '../static_codegen/route_guide_pb';

/**
 * Implements the routeChat RPC method.
 */
const routeChat: handleBidiStreamingCall<RouteNote, RouteNote> = call => {
  // const { request, metadata } = call;
  call
    .on('data', (data: RouteNote) => {
      const reply = new RouteNote();
      call.write(reply);
    })
    .on('end', () => {
      call.end();
    });
};

export default routeChat;
