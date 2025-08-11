# Bebop GraphQL API Overview

This document provides a comprehensive overview of the Bebop GraphQL API structure and available queries.

## Core Query Structure

The API provides three main data discovery queries and one main filtering query:

### Data Discovery Queries

#### 1. Event Types Query
Get all configured event types with their parameters:
```graphql
query {
  eventTypes {
    type        # e.g., "PURCHASE", "PAGE_VIEW"
    label       # Human-readable label
    params {
      name      # Parameter name
      type      # "numeric" or "string"
      label     # Human-readable label
    }
  }
}
```

#### 2. Parameters Query
Get all parameters across event types:
```graphql
query {
  parameters {
    name        # Parameter name
    label       # Human-readable label
    type        # "numeric" or "string"
    eventTypes  # Array of event types using this parameter
  }
}
```

#### 3. Claim Types Query
Get all configured claim types:
```graphql
query {
  claimTypes {
    name        # Claim name from config.auth.jwt.claims
  }
}
```

**Note:** Claims are defined in `config.auth.jwt.claims` and appear directly in the GraphQL schema documentation as fields in `EventClaimsInput`, making them discoverable in GraphQL IDEs.

#### 4. Current User Query
Get the current authenticated user's email:
```graphql
query {
  me  # Returns email string or null
}
```

## Discovery Query Comparison

All three discovery queries follow a similar pattern but return different types of metadata:

| Query | Returns | Use Case |
|-------|---------|----------|
| `eventTypes` | Configured event types with parameters | Understanding available events and their structure |
| `parameters` | All parameters across event types | Building dynamic parameter filters |
| `claimTypes` | Claim names from config.auth.jwt.claims | Building dynamic claim filters |

```graphql
# Complete discovery query
query GetAllMetadata {
  eventTypes {
    type
    label 
    params { name type label }
  }
  parameters {
    name
    label
    type
    eventTypes
  }
  claimTypes {
    name  # Just claim names, no values needed
  }
  me
}
```

### Main Events Query

The primary query for retrieving events with powerful filtering capabilities:

```graphql
query GetEvents(
  $limit: Int = 50,
  $offset: Int = 0,
  $order: String = "desc",
  $where: EventWhereInput
) {
  events(
    limit: $limit,
    offset: $offset,
    order: $order,
    where: $where
  ) {
    events {
      id
      eventName
      eventType
      createdAt
      params {
        id
        eventId
        paramName
        paramValue
        createdAt
      }
      traces {
        id
        eventId
        traceData
        createdAt
      }
      claims {
        id
        eventId
        claimName
        claimValue
        createdAt
      }
    }
    total
  }
}
```

## Filtering Options

The `EventWhereInput` supports multiple filtering dimensions:

### 1. Basic Event Filtering
```graphql
where: {
  eventName: { eq: "page_view" },
  eventType: PAGE_VIEW,
  createdAt: { 
    gte: 1704067200,  # Unix timestamp
    lte: 1704153600 
  }
}
```

### 2. Claims Filtering
Filter by user/session context data (all string-based):
```graphql
where: {
  claims: {
    Email: { eq: "user@example.com" },
    Role: { neq: "admin" },
    Department: { eq: "Engineering" },
    UserTier: { eq: "premium" }  # All claims use StringCondition
  }
}
```

### 3. Parameters Filtering
Filter by event-specific data (scoped to event types):
```graphql
where: {
  eventType: PURCHASE,
  params: {
    PURCHASE: {
      productId: { eq: "prod_123" },
      price: { gte: 100 },
      category: { neq: "electronics" }
    }
  }
}
```

### 4. Combined Filtering
Mix and match all filtering types:
```graphql
where: {
  # User context
  claims: {
    Email: { eq: "user@example.com" },
    Role: { eq: "customer" }
  },
  # Event specifics
  eventType: PURCHASE,
  createdAt: { gte: 1704067200 },
  # Event data
  params: {
    PURCHASE: {
      productId: { eq: "prod_123" },
      price: { gte: 50 }
    }
  }
}
```

## Condition Types

Claims and parameters support different condition operators:

### Claims (StringCondition only)
- `eq`: Equals (exact match)
- `neq`: Not equals

### Parameters (String/Number Conditions)
- `eq`: Equals
- `neq`: Not equals
- `gte`: Greater than or equal (numbers only)
- `lte`: Less than or equal (numbers only)

## Real-time Subscriptions

Subscribe to new events in real-time:
```graphql
subscription {
  eventsStream {
    id
    eventName
    eventType
    createdAt
    params {
      paramName
      paramValue
    }
    claims {
      claimName
      claimValue
    }
    traces {
      traceData
    }
  }
}
```

## Data Model Overview

### Events
- Core event records with name, type, and timestamp
- Events have associated params, traces, and claims

### Parameters (events_params)
- Event-specific data that varies by event type
- Configured in the application config
- Scoped to specific event types
- Examples: product IDs, page URLs, purchase amounts

### Claims (events_claims)
- User/session context data
- Global across all event types
- Dynamic, no configuration required
- Examples: email addresses, roles, departments, user IDs

### Traces (events_traces)
- Debugging/analytics data stored as JSON
- Stack traces, performance metrics, etc.

## Use Case Examples

### User Activity Analysis
```graphql
# Get all events for a specific user
query UserActivity($email: String!) {
  events(where: {
    claims: { Email: { eq: $email } }
  }) {
    events { eventName createdAt }
    total
  }
}
```

### Product Analytics
```graphql
# Get purchase events for a specific product
query ProductPurchases($productId: String!) {
  events(where: {
    eventType: PURCHASE,
    params: {
      PURCHASE: { productId: { eq: $productId } }
    }
  }) {
    events { 
      createdAt 
      params { paramName paramValue }
      claims { claimName claimValue }
    }
  }
}
```

### Department Filtering
```graphql
# Get events from Engineering department, excluding admin users
query DepartmentEvents {
  events(where: {
    claims: {
      Department: { eq: "Engineering" },
      Role: { neq: "admin" }
    }
  }) {
    events { eventName createdAt }
  }
}
```

### Time Range Analysis
```graphql
# Get high-value purchases from last week
query HighValuePurchases($startTime: Int!, $minAmount: Int!) {
  events(where: {
    eventType: PURCHASE,
    createdAt: { gte: $startTime },
    params: {
      PURCHASE: { amount: { gte: $minAmount } }
    }
  }) {
    events { 
      createdAt 
      params { paramName paramValue }
      claims { claimName claimValue }
    }
    total
  }
}
```

## Best Practices

### Use Claims For:
- User identification (email, user ID)
- Authorization context (roles, permissions)
- Organizational data (department, region)
- User attributes (tier, subscription level)
- All claim values are treated as strings (defined in config.auth.jwt.claims)

### Use Parameters For:
- Event-specific data (product IDs, amounts)
- Page/screen identifiers
- Action-specific metadata
- Business logic data that varies by event type

### Performance Tips:
- Use time range filtering (`createdAt`) for better performance
- Combine specific filters to reduce result sets
- Use pagination (`limit`/`offset`) for large datasets
- Consider indexing frequently queried claim names/values

### Schema Features:
- **Config-based Claims**: Available claim fields are generated from config.auth.jwt.claims and appear in GraphQL schema documentation
- **String-only Claims**: All claims use `StringCondition` (eq/neq operators only)
- **Field Sanitization**: Claim names with special characters are automatically sanitized for GraphQL compatibility

## Authentication

The API expects JWT tokens for authentication. The `me` query returns the authenticated user's email based on the JWT payload and validates it against stored claims.