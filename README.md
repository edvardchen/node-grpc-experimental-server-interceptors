# gRPC experimental server interceptors for Node.js

Since gRPC Node.js don't support
[server interceptors](https://github.com/grpc/grpc-node/issues/419),
I attempt to implement the experimental feature in TypeScript.

Inspired by
[echo health team work](https://github.com/echo-health/node-grpc-interceptors), but implement with more friendly koa-like API.

> For client interceptors, please visit [the proposal](https://github.com/grpc/proposal/blob/master/L5-node-client-interceptors.md) and [source code in grpc](https://github.com/grpc/grpc-node/blob/master/packages/grpc-native-core/src/client_interceptors.js)

## Usage

`ges` short for `gRPC experimental server`.

```bash
npm i ges
```

```javascript
import ExperimentalServer from 'ges';

const server = new ExperimentalServer();

// add interceptor
server.use(async (context, next) => {
  // preprocess
  const start = Date.now();
  try {
    await next();
  } finally {
    // postprocess
    const costtime = Date.now() - start;
    console.log('costtime is', costtime);
    console.log('response is ', context.response); // value, trailer, flags
  }
});

serer.bind(/* ... */);
server.start();
```

`ExperimentalServer` is inherited from the original [grpc Server]. So you still can access all api exposed by [grpc Server].

> You can treat `ExperimentalServer` as original server if you don't add any interceptor. I believe it don't have any performance effect.

[Server API details here](./packages/grpc-experimental-server/README.md)

## Interceptors

- [opentracing](./packages/grpc-interceptor-opentracing/README.md)

[grpc server]: https://grpc.github.io/grpc/node/grpc.Server.html
