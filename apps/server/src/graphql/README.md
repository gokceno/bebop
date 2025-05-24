# GraphQL Server Documentation

This directory contains the GraphQL implementation for the Bebop server using GraphQL Yoga.

## Overview

The GraphQL server provides a modern, type-safe API layer with the following features:

- **GraphQL Yoga**: Production-ready GraphQL server
- **Type Safety**: Comprehensive TypeScript integration
- **Authentication**: JWT-based authentication middleware
- **Error Handling**: Robust error handling and logging
- **GraphiQL**: Built-in GraphQL playground for development
- **CORS Support**: Configurable cross-origin resource sharing

## File Structure

```
src/graphql/
├── README.md           # This documentation
├── schema.ts          # GraphQL type definitions and resolvers
├── middleware.ts      # Authentication and context middleware
└── examples.graphql   # Example queries and mutations for testing
```

## Getting Started

### 1. Server Setup

The GraphQL server is automatically registered when you start the main server:

```bash
npm run dev
```

The GraphQL endpoint will be available at:
- **Endpoint**: `http://localhost:3000/graphql`
- **GraphiQL**: `http://localhost:3000/graphql` (GET request)

### 2. Testing Queries

You can test GraphQL queries in several ways:

#### Using GraphiQL (Recommended for Development)
1. Open `http://localhost:3000/graphql` in your browser
2. Use the built-in query editor and documentation explorer
3. Try the example queries from `examples.graphql`

#### Using curl
```bash
# Simple query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ hello }"}'

# Health check
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status timestamp } }"}'
```

#### Using a GraphQL Client
```javascript
// Example with fetch
const response = await fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    query: `
      query GetUsers {
        users {
          id
          username
          email
        }
      }
    `
  })
});
```

## Schema Overview

### Types

#### User
- Basic user management with profile information
- Relationships to posts and other entities
- Authentication-aware queries

#### Post
- Content management with rich text support
- Author relationships and metadata
- Publishing workflow support

#### Health
- System health and status monitoring
- Uptime and version information

### Operations

#### Queries
- `hello`: Simple greeting query
- `health`: System health status
- `users`: List all users
- `user(id)`: Get specific user
- `posts`: List all posts
- `post(id)`: Get specific post

#### Mutations
- `createUser`: Register new user
- `updateUser`: Update user profile
- `deleteUser`: Remove user account
- `createPost`: Create new post
- `updatePost`: Modify existing post
- `deletePost`: Remove post

#### Subscriptions (Planned)
- `userCreated`: Real-time user registration events
- `postCreated`: Real-time post creation events

## Authentication

### JWT Authentication

The GraphQL server supports JWT-based authentication:

1. **Include JWT Token**: Add `Authorization: Bearer <token>` header
2. **Context Access**: User information is available in resolver context
3. **Protected Operations**: Some mutations require authentication

### Authentication Helpers

```typescript
// In resolvers
const user = requireAuth(context);           // Require any authenticated user
const admin = requireRole(context, 'admin'); // Require specific role
const owner = requireOwnership(context, resourceUserId); // Require ownership
```

### Example Authenticated Request

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"query": "{ user(id: \"123\") { username email } }"}'
```

## Error Handling

The GraphQL server includes comprehensive error handling:

### Error Types
- **Authentication Errors**: Invalid or missing JWT tokens
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid input data
- **Database Errors**: Database connection or query issues
- **Internal Errors**: Unexpected server errors

### Error Response Format
```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ],
  "data": null
}
```

## Context

The GraphQL context provides access to:

```typescript
interface GraphQLContext {
  user?: User;           // Current authenticated user
  isAuthenticated: boolean; // Authentication status
  logger: Logger;        // Server logger instance
  db: Database;          // Database connection
  config: Config;        // Server configuration
}
```

## Development

### Adding New Types

1. **Define Type**: Add type definition to `schema.ts`
2. **Add Resolvers**: Implement query/mutation resolvers
3. **Update Context**: Add any required context data
4. **Test**: Create example queries in `examples.graphql`

### Adding Authentication

1. **Protect Resolver**: Use authentication helpers
2. **Check Permissions**: Implement role-based access
3. **Handle Errors**: Provide meaningful error messages

### Example New Resolver

```typescript
// In schema.ts resolvers
Query: {
  // ... existing resolvers
  myNewQuery: async (parent, args, context) => {
    // Authentication (if required)
    const user = requireAuth(context);
    
    // Business logic
    try {
      const result = await context.db.someModel.findMany({
        where: { userId: user.id }
      });
      return result;
    } catch (error) {
      context.logger.error('Query failed:', error);
      throw new Error('Failed to fetch data');
    }
  }
}
```

## Performance Considerations

### Query Complexity
- Use query depth limiting for deeply nested queries
- Implement query complexity analysis
- Consider query timeouts for long-running operations

### N+1 Problem
- Use DataLoader for batching database queries
- Implement efficient joins in resolvers
- Consider database query optimization

### Caching
- Implement Redis caching for frequently accessed data
- Use GraphQL response caching
- Consider persisted queries for production

## Security

### Best Practices
1. **Input Validation**: Validate all input parameters
2. **Rate Limiting**: Implement query rate limiting
3. **Query Depth**: Limit maximum query depth
4. **Authentication**: Always verify user permissions
5. **Sanitization**: Sanitize user input to prevent injection

### Production Considerations
- Disable GraphiQL in production
- Enable query whitelisting
- Implement comprehensive logging
- Use HTTPS for all communications
- Regular security audits

## Monitoring

### Metrics to Track
- Query execution time
- Error rates by operation
- Authentication success/failure rates
- Database query performance
- Memory and CPU usage

### Logging
All GraphQL operations are logged with:
- Query/mutation executed
- Execution time
- User context (if authenticated)
- Error details (if any)

## Deployment

### Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
CORS_ORIGIN=https://yourdomain.com
```

### Health Checks
Use the health query for application monitoring:
```graphql
query HealthCheck {
  health {
    status
    timestamp
    uptime
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check JWT token validity and format
2. **Database Errors**: Verify database connection and schema
3. **CORS Issues**: Configure CORS settings for your domain
4. **Performance Issues**: Check query complexity and database indices

### Debug Mode
Enable detailed logging by setting:
```bash
LOG_LEVEL=debug
```

### Support
For issues and questions:
1. Check the example queries in `examples.graphql`
2. Review error logs in the server console
3. Test queries in GraphiQL playground
4. Verify authentication tokens and permissions