import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs, resolvers } from "../graphql/schema";

export default async function graphqlRoute(fastify: FastifyInstance) {
  const schema = createSchema({
    typeDefs,
    resolvers,
  });

  const yoga = createYoga({
    schema: schema as any,
    graphiql: true,
    cors: {
      origin: "*",
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
