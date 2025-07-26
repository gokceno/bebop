import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createSchema, createYoga } from "graphql-yoga";
import { createTypeDefs, resolvers } from "../graphql/schema";

export default async function graphqlRoute(fastify: FastifyInstance) {
  const typeDefs = createTypeDefs(fastify.config);

  const schema = createSchema({
    typeDefs,
    resolvers,
  });

  const yoga = createYoga({
    schema: schema as any,
    logging: {
      debug(...args) {
        fastify.logger.debug([...args]);
      },
      info(...args) {
        fastify.logger.info([...args]);
      },
      warn(...args) {
        fastify.logger.warn([...args]);
      },
      error(...args) {
        fastify.logger.error([...args]);
      },
    },
    graphiql: false,
    cors: {
      origin: fastify.config.auth.cors?.allowedOrigins,
      credentials: true,
    },
  });

  const graphqlHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = await yoga.handleNodeRequestAndResponse(req, reply, {
        jwtPayload: req?.jwtPayload,
        authMethod: req?.authMethod,
        logger: fastify.logger,
        db: fastify.db,
        config: fastify.config,
      } as object);
      return response;
    } catch (error) {
      fastify.logger.error(error);
      reply.code(500).send({ error: "Internal server error" });
    }
  };

  fastify.addHook(
    "preHandler",
    fastify.auth([fastify.verifyJWT, fastify.verifyBearer])
  );

  fastify.get("/graphql", graphqlHandler);
  fastify.post("/graphql", graphqlHandler);
}
