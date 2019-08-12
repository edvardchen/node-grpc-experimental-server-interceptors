# `grpc-experimental-server`

gRPC experimental server that supports koa-like interceptors

## Usage

```bash
npm i ges
```

```javascript
import ExperimentalServer from 'ges';

const server = new ExperimentalServer();

server.addService(/* ... */);

// add interceptor
server.use(async (context, next) => {
  // preprocess
  const start = Date.now();
  try {
    await next();
  } finally {
    const costtime = Date.now() - start;
    console.log('costtime is', costtime);
    console.log('response is ', context.response); // value, trailer, flags
  }
});

serer.bind(/* ... */);
server.start();
```

`gRPC` has 4 kinds of call:

| handle type               | request is stream or not | response is stream or not |
| ------------------------- | :----------------------: | :-----------------------: |
| handleUnaryCall           |            ❌            |            ❌             |
| handleClientStreamingCall |            ✅            |            ❌             |
| handleServerStreamingCall |            ❌            |            ✅             |
| handleBidiStreamingCall   |            ✅            |            ✅             |

### Context

- `call` current gRPC call
- `definition` the method definition of current call
- `response` response if response is not `stream`
  - value
  - trailer
  - flags
- `onFinished(...)` you can listen on call finish event, no matter response of current call is stream or not. So you don't need to care about what kind is the call. **It is very useful to do something like `tracing`, `logging`**

## Notes

- `await next()` would wait the call to be finished if response is not stream.
