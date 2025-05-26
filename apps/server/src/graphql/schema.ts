export const typeDefs = `
  type Query {
    me: String
  }
`;

export const resolvers = {
  Query: {
    me: (_: any, __: any, context: any) => {
      return context.jwtPayload?.Email || null;
    },
  },
};
