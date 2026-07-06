---
"@gokceno/bebop-client": minor
"@gokceno/bebop-server": minor
---

Offload event collection to a background worker

- Enqueue collect requests in the API via BullMQ and process them in a separate worker.
- Add Redis dependency and update docker-compose, PM2 ecosystem config, environment examples, and scripts for the API/worker split.
- Replace domain-specific Bruno sample requests with generic log-level collect examples and update GraphQL queries accordingly.
- Move collect handler into src/handlers.
