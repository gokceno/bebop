---
"@gokceno/bebop-server": patch
---

Nest JWT options and use them for verification.

Move jwt.max_age into jwt.opts (schema and config) and pass opts to jwtVerify. Update example config to set max_age to 60d.
