# bebop-server

## 0.4.0

### Minor Changes

- 4b7ca4e: Added CLI for monitoring events in live.
- 47f0a52: Added GraphQL subscriptions to stream events with SSE.
- 2e5f2e3: bebop.yml updated to include param labels; GraphQL query added to fetch those params along with their data.
- c36a61d: Added "satisfies" to event handlers to check the authMethod in each handler.

### Patch Changes

- 6853903: GraphQL "event" now uses "EventType" enum instead of string. Added endpoint to query all event types.

## 0.3.0

### Minor Changes

- Ability to query events data with operators like eq, neq, gte and lte, via the GraphQL endpoint.

## 0.2.2

### Patch Changes

- d278c21: GraphQL queries return "total" for pagination.
- 950bf6e: Implement JWT verify or decode in the config file (feature itself is not implemented yet).
- 4d32c47: Parameter types validated against event types.
- 220097f: Moved collect handler to a separate file, added support for multiple handlers.
- 0e63539: Added support for CORS

## 0.2.1

### Patch Changes

- Bebop Client written from ground up to suppoer browsers and servers at the same time.

## 0.2.0

### Minor Changes

- d52e17c: Added GraphQL filtering by params defined in bebop.yml.

### Patch Changes

- 925083c: Ability to query events by originator email and event name.
- 379d932: Added GraphQL expansions into events params and traces.
- 5a48e93: Add JWT originator config and GraphQL events query
- 80ba5f9: Implement me query in the GraphQL server.

## 0.1.0

### Minor Changes

- Initial working version with /collect endpoint and dummy GraphQL server.
