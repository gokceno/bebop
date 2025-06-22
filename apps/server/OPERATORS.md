# GraphQL Query Operators

This document describes the available operators for filtering events in GraphQL queries.

## Overview

The GraphQL API uses comparison operators for filtering events. All fields that support filtering require using condition objects with specific operators.

## String Conditions

Available for `email` and `eventName` fields:

- `eq`: Equal to
- `neq`: Not equal to

```graphql
query {
  events(where: {
    email: { eq: "user@example.com" },
    eventName: { neq: "userLoggedOut" }
  }) {
    events {
      id
      eventName
      originator
    }
    total
  }
}
```

## Number Conditions

Available for `createdAt` field and numeric parameters:

- `eq`: Equal to
- `neq`: Not equal to
- `gte`: Greater than or equal to
- `lte`: Less than or equal to

```graphql
query {
  events(where: {
    createdAt: {
      gte: 1640995200,  # January 1, 2022
      lte: 1672531200   # December 31, 2022
    }
  }) {
    events {
      id
      eventName
      createdAt
    }
    total
  }
}
```

## Parameter Conditions

Dynamic event parameters now support the same condition operators as other fields. Parameters are organized by event type and parameter name:

```graphql
params: {
  [eventType]: {
    [paramName]: { [operator]: value }
  }
}
```

### String Parameters
- `eq`: Equal to (exact match)
- `neq`: Not equal to (exclusion)

### Numeric Parameters  
- `eq`: Equal to
- `neq`: Not equal to
- `gte`: Greater than or equal to
- `lte`: Less than or equal to

### Basic Parameter Examples

```graphql
# String parameter filtering
query {
  events(where: {
    params: {
      userLoggedIn: {
        deviceType: { eq: "mobile" },
        browser: { neq: "bot" }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

```graphql
# Numeric parameter range filtering
query {
  events(where: {
    params: {
      orderPlaced: {
        amount: { gte: 100, lte: 500 },
        discount: { neq: 0 }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

```graphql
# Multiple event types
query {
  events(where: {
    params: {
      userLoggedIn: {
        sessionId: { neq: "expired" }
      },
      orderPlaced: {
        currency: { eq: "USD" },
        amount: { gte: 50 }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

## Combining Conditions

You can combine multiple conditions in a single query:

```graphql
query {
  events(where: {
    eventName: { eq: "userLoggedIn" },
    email: { neq: "admin@example.com" },
    createdAt: { gte: 1640995200 }
  }) {
    events {
      id
      eventName
      createdAt
      originator
    }
    total
  }
}
```

## Examples by Use Case

### Find events in a date range
```graphql
query {
  events(where: {
    createdAt: {
      gte: 1640995200,  # Start date
      lte: 1672531200   # End date
    }
  }) {
    events { id eventName createdAt }
    total
  }
}
```

### Exclude specific users
```graphql
query {
  events(where: {
    email: { neq: "bot@example.com" }
  }) {
    events { id eventName originator }
    total
  }
}
```

### Find events after a specific timestamp
```graphql
query {
  events(where: {
    createdAt: { gte: 1672531200 }
  }) {
    events { id eventName createdAt }
    total
  }
}
```

### Find events before a specific timestamp
```graphql
query {
  events(where: {
    createdAt: { lte: 1640995200 }
  }) {
    events { id eventName createdAt }
    total
  }
}
```

### Find specific event type
```graphql
query {
  events(where: {
    eventName: { eq: "userLoggedIn" }
  }) {
    events { id eventName createdAt originator }
    total
  }
}
```

### Complex filtering with parameters
```graphql
query {
  events(where: {
    eventName: { eq: "orderPlaced" },
    email: { neq: "test@example.com" },
    createdAt: {
      gte: 1640995200,
      lte: 1672531200
    },
    params: {
      orderPlaced: {
        orderId: { neq: "cancelled-order" },
        amount: { gte: 50 }
      }
    }
  }) {
    events {
      id
      eventName
      createdAt
      originator
      params {
        paramName
        paramValue
      }
    }
    total
  }
}
```

### Common Parameter Use Cases

#### E-commerce Order Filtering
```graphql
# Find orders between $50-$500, paid with credit card, excluding test orders
query {
  events(where: {
    params: {
      orderPlaced: {
        amount: { gte: 50, lte: 500 },
        paymentMethod: { eq: "credit_card" },
        orderId: { neq: "test-order" }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

#### User Session Analysis
```graphql
# Find mobile users, excluding bots, with successful login attempts
query {
  events(where: {
    params: {
      userLoggedIn: {
        deviceType: { eq: "mobile" },
        userAgent: { neq: "bot" },
        loginAttempts: { lte: 3 }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

#### Performance Monitoring
```graphql
# Find API calls that took longer than 1000ms, excluding health checks
query {
  events(where: {
    params: {
      apiCall: {
        responseTime: { gte: 1000 },
        endpoint: { neq: "/health" },
        statusCode: { eq: 200 }
      }
    }
  }) {
    events { id eventName params { paramName paramValue } }
    total
  }
}
```

## Required Format

All filtering fields must use condition objects. You cannot use direct values:

❌ **Invalid (will not work):**
```graphql
where: { eventName: "userLoggedIn" }
where: { params: { orderPlaced: { amount: 100 } } }
```

✅ **Valid:**
```graphql
where: { eventName: { eq: "userLoggedIn" } }
where: { params: { orderPlaced: { amount: { eq: 100 } } } }
```

## Parameter Behavior & Performance

### Query Logic
- All parameter conditions within an event type are combined with AND logic
- Conditions across different event types are combined with OR logic
- Parameter filtering works in conjunction with event name matching
- Empty or null parameter values are ignored

### Type Handling
- String parameters support `eq` and `neq` operators only
- Numeric parameters support all operators (`eq`, `neq`, `gte`, `lte`)
- Parameter types are determined by your event configuration
- Numeric comparisons use SQLite's REAL type casting for accuracy

### Performance Considerations
- Parameter filtering creates EXISTS subqueries for each condition
- Consider indexing `events_params` table on `(event_id, param_name, param_value)` for better performance
- Use specific event type filtering when possible to reduce query scope

### Best Practices
1. **Combine with Event Type Filtering**: Always specify `eventName` when using parameter filters for better performance
2. **Use Appropriate Operators**: Use `neq` for exclusions, ranges (`gte`/`lte`) for numeric filtering
3. **Index Strategy**: Consider database indexes on frequently filtered parameter combinations
4. **Type Consistency**: Ensure parameter values match their configured types (string vs numeric)
5. **Query Optimization**: Use specific parameter combinations rather than broad filters when possible

## Notes

- All conditions within a `where` clause are combined with AND logic
- Timestamps are Unix timestamps (seconds since epoch)
- Parameter filtering now uses the same condition objects as other fields
- All filtering fields require using condition objects - no direct value assignment is supported
- Parameter conditions are applied within the context of their event type
- Numeric parameter comparisons use SQLite's REAL type casting for proper numerical comparison