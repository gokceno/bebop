const path = require("path");

module.exports = {
  apps: [
    {
      name: "bebop-api",
      script: "bun",
      args: "src/index.ts",
      cwd: path.join(__dirname),
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
    {
      name: "bebop-worker",
      script: "bun",
      args: "src/worker.ts",
      cwd: path.join(__dirname),
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
