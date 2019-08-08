import { handleUnaryCall } from 'grpc';
import { Point, Feature } from '../static_codegen/route_guide_pb';

/**
 * Implements the getFeature RPC method.
 */
const getFeature: handleUnaryCall<Point, Feature> = (call, callback) => {
  // const { request, metadata } = call;
  const reply = new Feature();
  callback(null, reply);
};

export default getFeature;
