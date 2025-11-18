---
"@gokceno/bebop-server": minor
---

Add paramsFlat filtering and in operator

Generate EventParamsFlatInput and include it in the GraphQL schema. Add in to StringCondition and paramsFlat to EventWhereInput types. Implement resolver handling for eventName.in and where.paramsFlat using events_params with EXISTS/NOT EXISTS checks and numeric comparisons (gte/lte) and support for eq/neq/in conditions.
