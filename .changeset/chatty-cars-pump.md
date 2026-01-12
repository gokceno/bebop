---
"@gokceno/bebop-server": minor
---

Optimize event param filtering queries

Replace per-param correlated EXISTS checks with a single JOIN and GROUP BY/HAVING to reduce subqueries and improve performance. Handle neq conditions with separate NOT EXISTS checks and unify logic for params and paramsFlat.
