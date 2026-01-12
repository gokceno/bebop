# bebop-server

## 0.6.1

### Patch Changes

- 80b73e2: Move Config type import to utils/config

## 0.6.0

### Minor Changes

- 52b97b4: Use Konfeti for config parsing

  Export parse and Config from utils/config and update imports. Rename yaml() to parse() and adjust auth to use jwt.opts.maxAge

- 99cfe25: Optimize event param filtering queries

  Replace per-param correlated EXISTS checks with a single JOIN and GROUP BY/HAVING to reduce subqueries and improve performance. Handle neq conditions with separate NOT EXISTS checks and unify logic for params and paramsFlat.

### Patch Changes

- b2ccbdc: Nest JWT options and use them for verification.

  Move jwt.max_age into jwt.opts (schema and config) and pass opts to jwtVerify. Update example config to set max_age to 60d.

- da214ac: Use jwtVerify instead of jwtDecode for auth.

## 0.5.0

### Minor Changes

- 58f6ab2: Changed the way claims are handled; replaced "originator" with events_claims table and added queries to fetch claim types and claims within events
- d6cf27c: Add paramsFlat filtering and in operator

  Generate EventParamsFlatInput and include it in the GraphQL schema. Add in to StringCondition and paramsFlat to EventWhereInput types. Implement resolver handling for eventName.in and where.paramsFlat using events_params with EXISTS/NOT EXISTS checks and numeric comparisons (gte/lte) and support for eq/neq/in conditions.

### Patch Changes

- ddb2fc3: Added CONFIG_PATH environment variable.
- f24ca67: Added DB_PATH environment variable.
- 91ffeb6: Fixed Me query to return from claims defined in the config file.

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
