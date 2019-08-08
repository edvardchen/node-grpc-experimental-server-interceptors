import { handleClientStreamingCall } from 'grpc';
import { Point, RouteSummary } from '../static_codegen/route_guide_pb';

/**
 * Implements the recordRoute RPC method.
 */
const recordRoute: handleClientStreamingCall<Point, RouteSummary> = (
  call,
  callback
) => {
  // const { request, metadata } = call;
  call
    .on('data', (data: Point) => {})
    .on('end', () => {
      const reply = new RouteSummary();
      callback(null, reply);
    });
};

export default recordRoute;
