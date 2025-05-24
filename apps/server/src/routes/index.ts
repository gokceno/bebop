import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

// This file enables proper loading of route plugins
const routeIndex: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // This function is intentionally empty
  // It allows the autoload plugin to load this directory correctly
};

export default routeIndex;