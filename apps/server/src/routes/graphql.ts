import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs, resolvers } from "../graphql/schema";

export default async function graphqlRoute(fastify: FastifyInstance) {
  const graphqlSchema = createSchema({
    typeDefs,
    resolvers,
  });

  const yoga = createYoga({
    schema: graphqlSchema,
    graphiql: true,
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  const graphqlHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = await yoga.handleNodeRequestAndResponse(req, reply);
      return response;
    } catch (error) {
      fastify.logger.error(error);
      reply.code(500).send({ error: "Internal server error" });
    }
  };

  fastify.get("/graphql", graphqlHandler);
  fastify.post("/graphql", graphqlHandler);
}
