# @gokceno/bebop-server

A lightweight, high-performance analytics server built with Fastify, TypeScript, SQLite, BullMQ, and Redis. Bebop Server provides a secure, configurable backend for collecting and querying analytics events with support for both REST and GraphQL APIs. Event collection is asynchronous: the API validates and enqueues events, and a separate worker writes them to SQLite.

## Features

- 🚀 **High Performance**: Built on Fastify for maximum throughput
- 🔒 **Dual Authentication**: JWT and Bearer token support
- 📊 **Flexible Event Schema**: YAML-based event type configuration
- 🗄️ **SQLite Database**: Lightweight, serverless database with Drizzle ORM
- 📈 **GraphQL API**: Rich querying capabilities with dynamic schema generation
- 🐳 **Docker Ready**: Production-ready containerization
- 🚀 **PM2 Ready**: Managed process setup for API and worker
- 📝 **TypeScript**: Full type safety throughout the codebase
- 🔍 **Event Tracing**: Built-in support for event trace data
- 🌐 **CORS Support**: Environment-aware Cross-Origin Resource Sharing
- ⚡ **Runtime**: Powered by Bun for exceptional performance

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.2.13 or higher
- Node.js 18+ (if not using Bun)
- Redis (BullMQ uses Redis for the collect job queue)

### Installation

```bash
# Clone the repository
git clone https://github.com/gokceno/bebop.git
cd bebop/apps/server

# Install dependencies
bun install

# Start the API server
bun run dev:api

# In a separate terminal, start the collect worker
bun run dev:worker
```

The API server will start on `http://localhost:3000`. The worker consumes
collect jobs from Redis and stores events in the database.

## Configuration

### bebop.yml

Configure your analytics server using the `bebop.yml` file:

```yaml
auth:
  bearer_tokens:
    - your-api-key-1
    - your-api-key-2
  jwt:
    secret: your-super-secret-jwt-key
    opts:
      max_age: 1d
    claims:
      - email
      - name
  cors:
    allowed_origins:
      - https://yourdomain.com
      - https://app.yourdomain.com
      - http://localhost:3000
      - http://localhost:5173

database:
  redis:
    url: redis://localhost:6379

event_types:
  - type: user_signup
    label: User Signup
    params:
      - email:
          type: string
          label: Email
      - source:
          type: string
          label: Source
    trace: true

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

  - type: purchase
    label: Purchase
    params:
      - amount:
          type: number
          label: Amount
      - product_id:
          type: string
          label: Product ID
      - user_id:
          type: string
          label: User ID
    trace: true
```

#### Configuration Options

**Database**
- `database.redis.url`: Redis connection URL used by BullMQ for the collect job queue

**Authentication**
- `bearer_tokens`: Array of valid API keys for bearer token authentication
- `jwt.secret`: Secret key for JWT token signing and verification
- `jwt.opts.max_age`: JWT token expiration time (e.g., "1d", "24h", "3600s")
- `jwt.claims`: Array of JWT claim names to extract and store
- `cors.allowed_origins`: Array of allowed origins for cross-origin requests
  - In development, all origins are automatically allowed
  - In production, only specified origins are permitted
  - Common local development ports are included by default

**Event Types**
- `type`: Event name (must be unique)
- `label`: Human-readable label for the event type (optional)
- `params`: Array of parameter definitions (objects with parameter name as key)
  - Each parameter has:
    - `type`: Either `"string"` or `"number"`
    - `label`: Human-readable label for the parameter
- `trace`: Whether this event type supports trace data

## Deployment

### Docker Compose

From the repository root:

```bash
docker compose up -d
```

This starts Redis, the API server, and the worker. The API is available at `http://localhost:3000`.

### PM2

From the repository root:

```bash
bun install
bun run start:all
```

Other useful commands:

```bash
bun run start:api     # API only
bun run start:worker  # worker only
bun run logs          # tail logs
bun run stop:all      # stop all
bun run restart:all   # restart all
bun run delete:all    # remove all from PM2
```

## API Reference

### Authentication

Bebop Server supports two authentication methods:

#### Bearer Token
```bash
curl -H "Authorization: Bearer your-api-key-1" \
     http://localhost:3000/collect
```

#### JWT Token
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3000/collect
```

### REST API

#### GET /

Health check endpoint.

**Response:**
```json
{
  "server": "running"
}
```

#### GET /collect

Returns collection endpoint status and authentication info.

**Response:**
```json
{
  "message": "Collect endpoint is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "auth": {
    "user": "user@example.com"
  }
}
```

#### POST /collect

Collect analytics events.

**Request Body:**
```json
{
  "$event": "user_signup",
  "$params": {
    "email": "user@example.com",
    "source": "homepage"
  },
  "$trace": [
    { "timestamp": 1704067200000, "action": "page_load" },
    { "timestamp": 1704067201000, "action": "form_focus" },
    { "timestamp": 1704067205000, "action": "form_submit" }
  ]
}
```

**Response:**
```json
{
  "queued": true,
  "jobId": "bullmq-job-id",
  "received": {
    "$event": "user_signup",
    "$params": {
      "email": "user@example.com",
      "source": "homepage"
    }
  },
  "auth": {
    "method": "jwt"
  }
}
```

`/collect` validates the event, enqueues it to BullMQ, and returns `202
Accepted`. A separate worker process then stores the event in the database.

### GraphQL API

Access the GraphQL playground at `http://localhost:3000/graphql`

#### Queries

**Get current user:**
```graphql
query {
  me {
    email
    name
    # Any other JWT claims configured in bebop.yml
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

The `me` query returns fields based on the JWT claims configured in your `bebop.yml`. Each claim becomes a queryable field.

**Query events:**
```graphql
query {
  events(limit: 10, offset: 0, order: "desc") {
    events {
      id
      eventName
      eventType
      createdAt
      params {
        paramName
        paramValue
      }
      traces {
        traceData
      }
      claims {
        claimName
        claimValue
      }
    }
    total
  }
}
```

**Filter events by specific event type:**
```graphql
query {
  events(
    where: {
      eventType: user_signup
      params: {
        user_signup: {
          source: { eq: "homepage" }
        }
      }
    }
  ) {
    events {
      id
      eventName
      createdAt
      params {
        paramName
        paramValue
      }
    }
    total
  }
}
```

**Filter by multiple event names:**
```graphql
query {
  events(
    where: {
      eventName: {
        in: ["user_signup", "purchase", "page_view"]
      }
    }
  ) {
    events {
      id
      eventName
      createdAt
    }
    total
  }
}
```

**Filter using flat parameters (across all event types):**
```graphql
query {
  events(
    where: {
      paramsFlat: {
        email: { eq: "user@example.com" }
        user_id: { eq: "user123" }
      }
    }
  ) {
    events {
      id
      eventName
      createdAt
      params {
        paramName
        paramValue
      }
    }
    total
  }
}
```

**Filter by JWT claims:**
```graphql
query {
  events(
    where: {
      claims: {
        email: { eq: "user@example.com" }
      }
    }
  ) {
    events {
      id
      eventName
      createdAt
      claims {
        claimName
        claimValue
      }
    }
    total
  }
}
```

#### Filter Options

**Where Clause:**
- `eventName`: Filter by event name
  - `eq`: Exact match (e.g., `{ eq: "user_signup" }`)
  - `neq`: Not equal (e.g., `{ neq: "page_view" }`)
  - `in`: Match any of multiple values (e.g., `{ in: ["user_signup", "purchase"] }`)
- `eventType`: Filter by specific event type enum value (e.g., `eventType: user_signup`)
- `createdAt`: Filter by timestamp
  - `eq`: Exact timestamp
  - `neq`: Not equal to timestamp
  - `gte`: Greater than or equal
  - `lte`: Less than or equal
- `params`: Filter by event-specific parameters (nested by event type)
  - Example: `params: { user_signup: { source: { eq: "homepage" } } }`
- `paramsFlat`: Filter by parameters across all event types (flat structure)
  - Example: `paramsFlat: { email: { eq: "user@example.com" }, user_id: { eq: "123" } }`
- `claims`: Filter by JWT claims
  - Example: `claims: { email: { eq: "user@example.com" } }`

**String Conditions:**
- `eq`: Equals
- `neq`: Not equals
- `in`: In array

**Number Conditions:**
- `eq`: Equals
- `neq`: Not equals
- `gte`: Greater than or equal
- `lte`: Less than or equal

**Pagination & Ordering:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `order`: Sort order "asc" or "desc" (default: "desc")

## Database Schema

Bebop Server uses SQLite with the following schema:

### Events Table
- `id`: Unique event identifier (CUID2)
- `event_name`: Type of event
- `originator`: JSON payload from JWT (user info)
- `created_at`: Timestamp

### Events Params Table
- `id`: Unique parameter identifier
- `event_id`: Foreign key to events table
- `param_name`: Parameter name
- `param_value`: Parameter value (stored as text)
- `created_at`: Timestamp

### Events Traces Table
- `id`: Unique trace identifier
- `event_id`: Foreign key to events table
- `trace_data`: JSON trace payload
- `created_at`: Timestamp

## Development

### Scripts

```bash
# API server with hot reload
bun run dev:api

# Worker with hot reload
bun run dev:worker

# Production API
bun run start:api

# Production worker
bun run start:worker

# Database migrations (if using Drizzle Kit)
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Project Structure

```
src/
├── graphql/
│   └── schema.ts          # GraphQL schema and resolvers
├── handlers/
│   └── default.ts        # Default collect event handler
├── routes/
│   ├── collect.ts         # Event collection endpoint
│   └── graphql.ts         # GraphQL endpoint
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   ├── auth.ts           # Authentication setup
│   ├── config.ts         # YAML configuration loader
│   ├── db.ts             # Database connection
│   ├── logger.ts         # Winston logger
│   └── queue.ts          # BullMQ queue setup
├── index.ts              # Main API server file
├── worker.ts             # BullMQ worker entrypoint
└── schema.ts             # Drizzle database schema
```

## Docker Deployment

### Using Docker Compose

The root `docker-compose.yml` starts Redis, the API server, and the worker:

```bash
# From the repository root
docker compose up -d

# View logs
docker compose logs -f
```

To stop:

```bash
docker compose down
```

### Manual Docker Build

From `apps/server`:

```bash
# Build image
docker build -t bebop-server .

# Run API container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/bebop.yml:/app/bebop.yml \
  -v $(pwd)/db:/app/db \
  -e DATABASE__REDIS__URL=redis://your-redis-host:6379 \
  --name bebop-server \
  bebop-server start:api

# Run worker container
docker run -d \
  -v $(pwd)/bebop.yml:/app/bebop.yml \
  -v $(pwd)/db:/app/db \
  -e DATABASE__REDIS__URL=redis://your-redis-host:6379 \
  --name bebop-worker \
  bebop-server start:worker
```

## Production Deployment

### Environment Variables

The server is configured through `bebop.yml`. Environment variables can override any value using `__` as the nested-key separator and `_0`, `_1`, etc. for array indices. See `env.example` for the full pattern.

```bash
# Override Redis URL
DATABASE__REDIS__URL=redis://redis:6379
```

Environment variables follow the same `__` nested-key pattern shown in `env.example`. There is no special `REDIS_URL` shortcut.

### Security Considerations

1. **JWT Secret**: Use a strong, random secret for JWT signing
2. **Bearer Tokens**: Generate cryptographically secure API keys
3. **HTTPS**: Always use HTTPS in production
4. **Database**: Ensure SQLite file has proper permissions
5. **Logs**: Configure appropriate log levels for production
6. **CORS**: Configure `allowed_origins` to restrict cross-origin access to trusted domains only

### Performance Tuning

1. **Database**: Consider using WAL mode for SQLite
2. **Concurrency**: Adjust Fastify server options for your load
3. **Logging**: Use appropriate log levels (avoid debug in production)
4. **Memory**: Monitor memory usage for high-volume deployments

## Integration with Bebop Client

Use with the [@gokceno/bebop-client](../../../packages/client) for seamless event collection:

```javascript
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://your-bebop-server.com',
  bearerToken: 'your-api-key',
  concurrency: 5
});

// Send events to your server
client.sendAsync('user_signup', {
  email: 'user@example.com',
  source: 'homepage'
});
```

### Browser Integration

The server includes CORS support for browser-based applications:

```javascript
// Frontend application (React, Vue, etc.)
import { Bebop } from '@gokceno/bebop-client';

const client = Bebop({
  baseUrl: 'https://api.yourdomain.com', // Must be in allowed_origins
  bearerToken: 'your-api-key',
  concurrency: 3
});

// Works from browser without CORS issues
await client.send('page_view', {
  page_url: window.location.pathname,
  user_id: 'user123'
});
```

**Note**: Make sure your domain is included in the `cors.allowed_origins` configuration for production deployments.

## API Testing

Example requests using Bruno or curl:

### Collect Event
```bash
curl -X POST http://localhost:3000/collect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "$event": "page_view",
    "$params": {
      "page_url": "/dashboard",
      "user_id": "user123"
    }
  }'
```

### GraphQL Query
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "query": "query { events(limit: 5) { id eventName createdAt } }"
  }'
```

## Monitoring and Logging

Bebop Server uses Winston for structured logging:

- **Debug**: Detailed request/response information
- **Info**: Server startup, important events
- **Warn**: Non-critical issues
- **Error**: Application errors

Configure logging in your production environment to capture and analyze server metrics.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/gokceno/bebop/issues)
- Documentation: Check the [client documentation](../../../packages/client/README.md) for integration examples
