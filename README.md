# Bebop Analytics Platform

A lightweight, high-performance analytics platform designed for modern applications. Bebop provides a complete solution for collecting, storing, and querying user events with minimal overhead and maximum flexibility. Event collection is asynchronous via BullMQ and Redis, with a dedicated worker handling database writes.

## 🎯 Overview

Bebop consists of two main components that work seamlessly together:

- **📊 Bebop Server** - A fast, secure analytics backend built with Fastify and SQLite
- **📱 Bebop Client** - A universal JavaScript client for browsers and Node.js

Whether you're building a web app, mobile app, or server-side application, Bebop provides the tools you need to understand user behavior without the complexity of traditional analytics platforms.

## ✨ Key Features

### 🚀 Performance First
- **Zero Dependencies**: Client has no external dependencies, uses native fetch
- **Lightweight**: Minimal bundle size and memory footprint
- **High Throughput**: Fastify-based server optimized for concurrent requests
- **Non-blocking**: Fire-and-forget analytics that never slow down your UI

### 🔒 Security & Flexibility
- **Dual Authentication**: JWT and Bearer token support
- **HTTPS Only**: Secure communication by default
- **Configurable Schema**: YAML-based event type definitions
- **TypeScript**: Full type safety across the entire platform

### 🌐 Universal Compatibility
- **Cross-Platform Client**: Works in browsers, Node.js, and edge environments
- **Docker Ready**: Production-ready containerization
- **Self-Hosted**: Complete control over your data
- **GraphQL + REST**: Multiple API interfaces for different use cases

## 📦 Components

### [Bebop Server](./apps/server)
A production-ready analytics backend that receives, validates, and queues events for asynchronous processing.

**Features:**
- FastAPI-based REST endpoints
- GraphQL API with dynamic schema generation
- SQLite database with Drizzle ORM
- BullMQ + Redis for asynchronous event processing
- Separate worker process for database writes
- Configurable event types and parameters
- Built-in event tracing support
- Docker deployment ready
- PM2 deployment ready

**Quick Start:**
```bash
cd apps/server
bun install

# Terminal 1: start Redis
redis-server

# Terminal 2: start the API server
bun run dev

# Terminal 3: start the worker
bun run dev:worker
```

[📖 Server Documentation →](./apps/server/README.md)

### [Bebop Client](./packages/client)
A universal JavaScript client for sending analytics events from any environment.

**Features:**
- Browser and Node.js support
- Non-blocking event sending
- Built-in queue management
- TypeScript definitions included
- Zero external dependencies
- Configurable concurrency

**Quick Start:**
```bash
npm install @gokceno/bebop-client
```

```javascript
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://your-bebop-server.com',
  bearerToken: 'your-api-key'
});

// Non-blocking event sending
client.sendAsync('user_clicked', {
  buttonId: 'signup',
  page: '/landing'
});
```

[📖 Client Documentation →](./packages/client/README.md)

## 🚀 Getting Started

### 1. Start the Server

You need Redis running first, then start both the API server and the worker.

```bash
# Clone the repository
git clone https://github.com/gokceno/bebop.git
cd bebop

# Start Redis (or run it via Docker)
redis-server

# Terminal 1: API server
cd apps/server
bun install
bun run dev:api

# Terminal 2: worker
cd apps/server
bun run dev:worker
```

### 2. Configure Event Types

Edit `apps/server/bebop.yml` to define your analytics events:

```yaml
auth:
  bearer_tokens:
    - your-api-key
  jwt:
    secret: your-jwt-secret
    opts:
      max_age: 1d
    claims:
      - email
      - name
  cors:
    allowed_origins:
      - https://yourdomain.com

database:
  redis:
    url: redis://localhost:6379

event_types:
  - type: page_view
    label: Page View
    params:
      - page_url:
          type: string
          label: Page URL
      - user_id:
          type: string
          label: User ID
    trace: false

  - type: button_click
    label: Button Click
    params:
      - button_id:
          type: string
          label: Button ID
      - page:
          type: string
          label: Page
    trace: true
```

### 3. Install and Use the Client

```bash
npm install @gokceno/bebop-client
```

```javascript
import { Bebop } from '@gokceno/bebop-client';

const analytics = Bebop({
  baseUrl: 'http://localhost:3000',
  bearerToken: 'your-api-key',
  concurrency: 5
});

// Track events
analytics.sendAsync('page_view', {
  page_url: '/dashboard',
  user_id: 'user123'
});

analytics.sendAsync('button_click', {
  button_id: 'save',
  page: '/settings'
}, [
  { timestamp: Date.now(), action: 'hover' },
  { timestamp: Date.now() + 100, action: 'click' }
]);
```

### 4. Query Your Data

Use the GraphQL playground at `http://localhost:3000/graphql`:

```graphql
query {
  events(limit: 10, order: "desc") {
    id
    eventName
    createdAt
    params {
      paramName
      paramValue
    }
    traces {
      traceData
    }
  }
}
```

## 🐳 Docker Deployment

Deploy the full stack (Redis + API + worker) with Docker Compose:

```bash
# In project root
docker compose up -d
```

The included `docker-compose.yml` sets up Redis, the API server, and the worker with persistent SQLite storage.

## 🚀 PM2 Deployment

Run the API and worker as managed processes with PM2:

```bash
# In project root
bun install

# Start both
bun run start:all

# Start individually
bun run start:api
bun run start:worker

# Manage
bun run logs
bun run stop:all
bun run restart:all
bun run delete:all
```

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS/REST     ┌─────────────────┐    enqueue     ┌───────────────┐
│   Bebop Client  │ ────────────────► │   Bebop API     │ ─────────────► │  BullMQ/Redis │
│                 │                   │                 │                │               │
│ • Browser       │                   │ • Fastify       │                │               │
│ • Node.js       │                   │ • GraphQL       │                │               │
│ • Edge Runtime  │                   │ • Validation    │                │               │
└─────────────────┘                   └─────────────────┘                └───────┬───────┘
                                                                                 │
                                                                                 │ consume
                                                                                 ▼
                                                                        ┌─────────────────┐
                                                                        │  Bebop Worker   │
                                                                        │  • SQLite writes│
                                                                        └─────────────────┘
```

**Data Flow:**
1. Client captures events in your application
2. Events are queued and sent to server via REST API
3. Server validates the event and enqueues it to BullMQ/Redis
4. Worker consumes the job and stores the event in SQLite
5. Data is queryable via GraphQL or REST endpoints
6. Built-in dashboard for real-time analytics (coming soon)

## 🛠️ Development

This is a monorepo managed with Turbo. Key commands:

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Start development (API + worker + Redis)
cd apps/server
redis-server
bun run dev         # API
bun run dev:worker  # worker

# Run tests
bun test

# Release new versions
bun run release
```

## 📊 Use Cases

- **Web Analytics**: Track page views, user interactions, conversion funnels
- **Feature Usage**: Monitor which features are used most frequently
- **Performance Monitoring**: Capture timing data and user experience metrics
- **A/B Testing**: Collect data for experimental feature analysis
- **Business Intelligence**: Custom event tracking for business insights
- **Error Tracking**: Log application errors with context
- **User Journey Analysis**: Trace user paths through your application

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is released into the public domain under The Unlicense. See [LICENSE](./LICENSE) for details.

## 🔗 Links

- [Server Documentation](./apps/server/README.md)
- [Client Documentation](./packages/client/README.md)
- [GitHub Repository](https://github.com/gokceno/bebop)
- [Issues & Support](https://github.com/gokceno/bebop/issues)

---

**Built with ❤️ for developers who value simplicity, performance, and privacy.**
