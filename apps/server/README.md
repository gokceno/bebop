# @gokceno/bebop-server

A lightweight, high-performance analytics server built with Fastify, TypeScript, and SQLite. Bebop Server provides a secure, configurable backend for collecting and querying analytics events with support for both REST and GraphQL APIs.

## Features

- 🚀 **High Performance**: Built on Fastify for maximum throughput
- 🔒 **Dual Authentication**: JWT and Bearer token support
- 📊 **Flexible Event Schema**: YAML-based event type configuration
- 🗄️ **SQLite Database**: Lightweight, serverless database with Drizzle ORM
- 📈 **GraphQL API**: Rich querying capabilities with dynamic schema generation
- 🐳 **Docker Ready**: Production-ready containerization
- 📝 **TypeScript**: Full type safety throughout the codebase
- 🔍 **Event Tracing**: Built-in support for event trace data
- 🌐 **CORS Support**: Environment-aware Cross-Origin Resource Sharing
- ⚡ **Runtime**: Powered by Bun for exceptional performance

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.2.13 or higher
- Node.js 18+ (if not using Bun)

### Installation

```bash
# Clone the repository
git clone https://github.com/gokceno/bebop.git
cd bebop/apps/server

# Install dependencies
bun install

# Start development server
bun run dev
```

The server will start on `http://localhost:3000`

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
    max_age: 1d

cors:
  allowed_origins:
    - https://yourdomain.com
    - https://app.yourdomain.com
    - http://localhost:3000
    - http://localhost:5173

event_types:
  - type: user_signup
    params:
      - email: string
      - source: string
    trace: true

  - type: page_view
    params:
      - page_url: string
      - user_id: string
    trace: false

  - type: purchase
    params:
      - amount: numeric
      - product_id: string
      - user_id: string
    trace: true
```

#### Configuration Options

**Authentication**
- `bearer_tokens`: Array of valid API keys for bearer token authentication
- `jwt.secret`: Secret key for JWT token signing and verification
- `jwt.max_age`: JWT token expiration time (e.g., "1d", "24h", "3600s")

**CORS Configuration**
- `cors.allowed_origins`: Array of allowed origins for cross-origin requests
  - In development, all origins are automatically allowed
  - In production, only specified origins are permitted
  - Common local development ports are included by default

**Event Types**
- `type`: Event name (must be unique)
- `params`: Array of parameter definitions with name and type
  - `string`: Text parameters
  - `numeric`: Number parameters
- `trace`: Whether this event type supports trace data

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
  "eventIds": [
    {
      "default": "clw2x1y2z3000abc123def456"
    }
  ],
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
# Development with hot reload
bun run dev

# Production start
bun run start

# Database migrations (if using Drizzle Kit)
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Project Structure

```
src/
├── graphql/
│   └── schema.ts          # GraphQL schema and resolvers
├── routes/
│   ├── collect.ts         # Event collection endpoint
│   └── graphql.ts         # GraphQL endpoint
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   ├── auth.ts           # Authentication setup
│   ├── config.ts         # YAML configuration loader
│   ├── db.ts             # Database connection
│   └── logger.ts         # Winston logger
├── index.ts              # Main server file
└── schema.ts             # Drizzle database schema
```

## Docker Deployment

### Using Docker Compose

```yaml
services:
  server:
    build:
      context: ./apps/server
    container_name: bebop-server
    command: start
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./apps/server/db/bebop.sqlite:/app/db/bebop.sqlite
      - ./apps/server/bebop.yml:/app/bebop.yml
```

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f server
```

### Manual Docker Build

```bash
# Build image
docker build -t bebop-server .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/bebop.yml:/app/bebop.yml \
  -v $(pwd)/db:/app/db \
  --name bebop-server \
  bebop-server
```

## Production Deployment

### Environment Variables

While the server primarily uses `bebop.yml` for configuration, you can set these environment variables:

```bash
# Database path (default: ./db/bebop.sqlite)
DATABASE_URL=./db/bebop.sqlite

# Server port (default: 3000)
PORT=3000

# Server host (default: 0.0.0.0)
HOST=0.0.0.0
```

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
