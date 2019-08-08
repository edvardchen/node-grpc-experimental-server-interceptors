import { handleServerStreamingCall } from 'grpc';
import { Rectangle, Feature } from '../static_codegen/route_guide_pb';

/**
 * Implements the listFeatures RPC method.
 */
const listFeatures: handleServerStreamingCall<Rectangle, Feature> = call => {
  // const { request, metadata } = call;
  const reply = new Feature();
  call.write(reply);
  call.end();
};

export default listFeatures;
