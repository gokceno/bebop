# @gokceno/bebop-client

A lightweight, cross-platform client for sending events to Bebop analytics service.

## Features

- 🌐 **Universal**: Works in both Node.js (18+) and browser environments
- ⚡ **Lightweight**: Zero external dependencies, uses native fetch
- 🔄 **Queue Management**: Built-in concurrency control with shared implementation
- 🔒 **Secure**: HTTPS-only with JWT/Bearer token authentication
- 📝 **TypeScript**: Full TypeScript support with type definitions
- 🚀 **Non-blocking**: Fire-and-forget analytics for instant UI responses

## Installation

```bash
npm install @gokceno/bebop-client
```

## Usage

### Browser/Frontend (Next.js, React, etc.)

#### Non-Blocking Usage (Recommended for UI)

```javascript
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://your-bebop-instance.com',
  bearerToken: 'your-bearer-token', // or jwt: 'your-jwt-token'
  concurrency: 1, // optional, default: 1
  output: false // optional, default: false (set to true for debugging)
});

// 🚀 Non-blocking send (fire-and-forget)
client.sendAsync('user_clicked', {
  buttonId: 'submit',
  page: '/signup'
});

// 🚀 Non-blocking with trace
client.sendAsync('user_clicked', {
  buttonId: 'submit'
}, [
  { timestamp: Date.now(), action: 'hover' },
  { timestamp: Date.now() + 100, action: 'click' }
]);

// ⏳ Wait for all pending events to be sent (optional)
await client.flush();
```

#### Blocking Usage (if you need to wait)

```javascript
// Send an event and wait for completion
await client.send('user_clicked', {
  buttonId: 'submit',
  page: '/signup'
});

// Send an event with trace and wait
await client.send('user_clicked', {
  buttonId: 'submit'
}, [
  { timestamp: Date.now(), action: 'hover' },
  { timestamp: Date.now() + 100, action: 'click' }
]);
```

### Node.js/Backend

#### High-Performance Non-Blocking (Recommended for servers)

```javascript
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://your-bebop-instance.com',
  jwt: 'your-jwt-token', // or bearerToken: 'your-bearer-token'
  concurrency: 10, // Higher concurrency for server environments
  output: true // Enable logging for debugging
});

// 🚀 Non-blocking server events
client.sendAsync('server_event', {
  userId: '12345',
  action: 'purchase',
  amount: 99.99
});

// ⏳ Flush before server shutdown
process.on('SIGTERM', async () => {
  await client.flush();
  process.exit(0);
});
```

#### Blocking Usage (for critical events)

```javascript
// Send a critical event and wait for confirmation
await client.send('server_event', {
  userId: '12345',
  action: 'purchase',
  amount: 99.99
});
```

## API Reference

### `Bebop(config)`

Creates a new Bebop client instance.

#### Configuration Options

- `baseUrl` (required): The HTTPS URL of your Bebop analytics service
- `bearerToken` or `jwt` (required): Authentication token
- `concurrency` (optional): Number of concurrent requests, default: 1
- `output` (optional): Enable console logging, default: false

#### Returns

A client object with the following methods:

- `send()`: Send event and wait for completion (blocking)
- `sendAsync()`: Send event without waiting (non-blocking)
- `flush()`: Wait for all pending events to complete

### `client.send(eventName, eventParams?, eventTrace?)`

Sends an event to the Bebop service and waits for completion (blocking).

#### Parameters

- `eventName` (string): Name of the event
- `eventParams` (object, optional): Event parameters/payload
- `eventTrace` (array, optional): Array of trace objects for event tracking

#### Returns

A Promise that resolves when the event is sent.

### `client.sendAsync(eventName, eventParams?, eventTrace?)`

Sends an event to the Bebop service without waiting (non-blocking, fire-and-forget).

#### Parameters

- `eventName` (string): Name of the event
- `eventParams` (object, optional): Event parameters/payload
- `eventTrace` (array, optional): Array of trace objects for event tracking

#### Returns

Nothing (void). Errors are handled internally and logged if `output` is enabled.

### `client.flush()`

Waits for all pending events (including batched events) to be sent.

#### Returns

A Promise that resolves when all pending events are sent.

## Universal Architecture

The package uses a unified implementation across all environments:

- **Universal HTTP**: Native `fetch` API (Node.js 18+ and all modern browsers)
- **Shared Queue**: Same lightweight queue implementation everywhere
- **Zero Dependencies**: No external libraries required

## Performance & Non-Blocking Usage

### Why Non-Blocking?

In frontend applications, you don't want analytics events to slow down user interactions. Non-blocking methods ensure:

- **Instant UI responses**: Button clicks, page transitions are never delayed
- **Better UX**: No waiting for network requests to complete
- **Resilient**: Continues working even if analytics service is slow/down

### When to Use Each Method

| Method | Use Case | Performance | Error Handling |
|--------|----------|-------------|----------------|
| `sendAsync()` | 🏆 **Most UI events** | Fastest | Fire-and-forget |
| `send()` | Critical events only | Slower | Full error handling |

### Queue Management

Control request concurrency:

```javascript
const client = Bebop({
  // ... other config
  concurrency: 5 // Process up to 5 requests simultaneously
});
```

- **Prevents overwhelming**: Limits concurrent requests to your analytics service
- **Better performance**: Optimal throughput without blocking
- **Configurable**: Adjust based on your server capacity

## Architecture Benefits

- **🔄 Code Reuse**: Browser and Node.js versions share 95% of the same code
- **📦 Smaller Bundle**: No external dependencies means smaller package size (3.19 KB)
- **⚡ Performance**: Native fetch is faster and more reliable than third-party HTTP clients
- **🛡️ Security**: Fewer dependencies = smaller attack surface
- **🧪 Testing**: Single implementation is easier to test and maintain
- **🎯 Simplicity**: Clean API focused on core functionality

## Error Handling

The client includes built-in error handling:

- Validates HTTPS URLs
- Requires authentication tokens
- Handles network errors gracefully
- Optional console logging for debugging
- **Non-blocking methods**: Errors don't affect your app's performance

## Requirements

- **Node.js**: Version 18.0.0 or higher (for native fetch support)
- **Browsers**: All modern browsers with fetch support (Chrome 42+, Firefox 39+, Safari 10.1+)

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { Bebop, BebopConfig, BebopClient } from '@gokceno/bebop-client';

const config: BebopConfig = {
  baseUrl: 'https://analytics.example.com',
  bearerToken: 'token'
};

const client: BebopClient = Bebop(config);
```

## License

MIT