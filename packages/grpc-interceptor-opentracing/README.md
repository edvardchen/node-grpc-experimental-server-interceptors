# `grpc-interceptor-opentracing`

start span and chain on previous one if exists, then report when grpc call finish

## Usage

```bash
npm i grpc-interceptor-opentracing
```

```typescript
import opentracing from 'grpc-interceptor-opentracing';

server.use(opentracing(options));
```

### Options

- `tracer` [opentracing tracer](https://github.com/opentracing/opentracing-javascript#opentracing-tracer-implementations). If omitted, the global tracer would be used.
