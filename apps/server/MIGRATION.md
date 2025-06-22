# Migration Guide: GraphQL Operators Breaking Changes

This guide helps you migrate from the old direct value format to the new operator-based format for GraphQL queries.

## Overview

We've removed backward compatibility for direct value assignments in `where` clauses. All filtering now requires using condition objects with explicit operators.

## Breaking Changes

### Before (Old Format - No Longer Supported)
```graphql
query {
  events(where: {
    eventName: "userLoggedIn",
    email: "user@example.com", 
    createdAt: 1640995200,
    params: {
      userLoggedIn: {
        sessionId: "session-123",
        deviceType: "mobile"
      }
    }
  }) {
    events { id eventName createdAt }
    total
  }
}
```

### After (New Format - Required)
```graphql
query {
  events(where: {
    eventName: { eq: "userLoggedIn" },
    email: { eq: "user@example.com" },
    createdAt: { eq: 1640995200 },
    params: {
      userLoggedIn: {
        sessionId: { eq: "session-123" },
        deviceType: { eq: "mobile" }
      }
    }
  }) {
    events { id eventName createdAt }
    total
  }
}
```

## Migration Steps

### 1. String Fields (email, eventName)

**Old:**
```graphql
where: { email: "user@example.com" }
where: { eventName: "userLoggedIn" }
```

**New:**
```graphql
where: { email: { eq: "user@example.com" } }
where: { eventName: { eq: "userLoggedIn" } }
```



### 3. Number Fields (createdAt)

**Old:**
```graphql
where: { createdAt: 1640995200 }
```

**New:**
```graphql
where: { createdAt: { eq: 1640995200 } }
```

### 4. Parameter Fields

**Old:**
```graphql
where: {
  params: {
    orderPlaced: {
      orderId: "12345",
      amount: 100
    }
  }
}
```

**New:**
```graphql
where: {
  params: {
    orderPlaced: {
      orderId: { eq: "12345" },
      amount: { eq: 100 }
    }
  }
}
```

### 5. Multiple Conditions

**Old:**
```graphql
where: {
  eventName: "userLoggedIn",
  email: "user@example.com"
}
```

**New:**
```graphql
where: {
  eventName: { eq: "userLoggedIn" },
  email: { eq: "user@example.com" }
}
```

## Benefits of the New Format

The new format provides much more flexibility:

### Range Queries
```graphql
# Events from last month
where: {
  createdAt: {
    gte: 1672531200,  # Start of range
    lte: 1675209600   # End of range
  }
}
```

### Exclusion Filters
```graphql
# All events except from admin users
where: {
  email: { neq: "admin@example.com" }
}
```

### Parameter Range Queries
```graphql
# Parameters with numeric ranges
where: {
  params: {
    orderPlaced: {
      amount: { gte: 100, lte: 500 },
      discount: { neq: 0 }
    }
  }
}
```

### Complex Combinations
```graphql
where: {
  eventName: { eq: "orderPlaced" },
  email: { neq: "test@example.com" },
  createdAt: { gte: 1640995200 },
  params: {
    orderPlaced: {
      orderId: { neq: "cancelled" },
      amount: { gte: 50 }
    }
  }
}
```

## Common Migration Patterns

### 1. Simple Equality
```diff
- where: { eventName: "userLoggedIn" }
+ where: { eventName: { eq: "userLoggedIn" } }
```

### 2. User Filtering
```diff
- where: { email: "user@example.com" }
+ where: { email: { eq: "user@example.com" } }
```

### 3. Date Filtering
```diff
- where: { createdAt: 1640995200 }
+ where: { createdAt: { eq: 1640995200 } }
```

### 4. Parameter Filters
```diff
- where: {
-   params: {
-     orderPlaced: {
-       amount: 100,
-       currency: "USD"
-     }
-   }
- }
+ where: {
+   params: {
+     orderPlaced: {
+       amount: { eq: 100 },
+       currency: { eq: "USD" }
+     }
+   }
+ }
```

### 5. Combined Filters
```diff
- where: {
-   eventName: "userLoggedIn",
-   email: "user@example.com",
-   params: {
-     userLoggedIn: {
-       sessionId: "session-123"
-     }
-   }
- }
+ where: {
+   eventName: { eq: "userLoggedIn" },
+   email: { eq: "user@example.com" },
+   params: {
+     userLoggedIn: {
+       sessionId: { eq: "session-123" }
+     }
+   }
+ }
```

## Available Operators

### String Fields (email, eventName)
- `eq`: Equals
- `neq`: Not equals

### Number Fields (createdAt)
- `eq`: Equals
- `neq`: Not equals
- `gte`: Greater than or equal to
- `lte`: Less than or equal to

### Parameter Fields
**String Parameters:**
- `eq`: Equals
- `neq`: Not equals

**Numeric Parameters:**
- `eq`: Equals
- `neq`: Not equals
- `gte`: Greater than or equal to
- `lte`: Less than or equal to

## Testing Your Migration

Use these test queries to verify your migration:

### Basic Equality Test
```graphql
query {
  events(where: { eventName: { eq: "userLoggedIn" } }, limit: 1) {
    events { id eventName }
    total
  }
}
```

### Range Test
```graphql
query {
  events(where: { 
    createdAt: { gte: 1640995200, lte: 1672531200 } 
  }, limit: 1) {
    events { id createdAt }
    total
  }
}
```

### Exclusion Test
```graphql
query {
  events(where: { email: { neq: "admin@example.com" } }, limit: 1) {
    events { id originator }
    total
  }
}
```

### Parameter Test
```graphql
query {
  events(where: { 
    params: {
      orderPlaced: {
        amount: { gte: 100 },
        currency: { eq: "USD" }
      }
    }
  }, limit: 1) {
    events { id params { paramName paramValue } }
    total
  }
}
```

## Automated Migration Script

If you have many queries to migrate, you can use this regex pattern to help:

### Find Pattern
```regex
(\w+):\s*"([^"]+)"
```

### Replace Pattern
```regex
$1: { eq: "$2" }
```

### For Numbers
```regex
(\w+):\s*(\d+)
```

### Replace Pattern
```regex
$1: { eq: $2 }
```

## Need Help?

If you encounter issues during migration:

1. Check that all direct value assignments are wrapped in condition objects
2. Ensure you're using the correct operators (`eq`, `neq`, `gte`, `lte`)
3. Verify field names are correct (`email`, `eventName`, `createdAt`)
4. Test with the provided example queries above

## What Wasn't Changed

- Query structure, pagination, and ordering remain the same
- Response format is unchanged
- All other GraphQL functionality is unaffected
- Parameter types (string vs numeric) are still determined by your event configuration