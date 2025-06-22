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

Available for `createdAt` field:

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

### Complex filtering
```graphql
query {
  events(where: {
    eventName: { eq: "orderPlaced" },
    email: { neq: "test@example.com" },
    createdAt: {
      gte: 1640995200,
      lte: 1672531200
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

## Required Format

All filtering fields must use condition objects. You cannot use direct values:

❌ **Invalid (will not work):**
```graphql
where: { eventName: "userLoggedIn" }
```

✅ **Valid:**
```graphql
where: { eventName: { eq: "userLoggedIn" } }
```

## Notes

- All conditions within a `where` clause are combined with AND logic
- Timestamps are Unix timestamps (seconds since epoch)
- The `params` filtering continues to work as before and is not affected by these changes
- All filtering fields require using condition objects - no direct value assignment is supported