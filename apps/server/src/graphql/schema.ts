export const typeDefs = `
  type Query {
    hello: String
    health: HealthStatus
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean
    createPost(input: CreatePostInput!): Post
    updatePost(id: ID!, input: UpdatePostInput!): Post
    deletePost(id: ID!): Boolean
  }

  type Subscription {
    userCreated: User
    postCreated: Post
  }

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String
    avatar: String
    bio: String
    posts: [Post!]!
    createdAt: String!
    updatedAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    excerpt: String
    published: Boolean!
    author: User!
    authorId: ID!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    version: String
    uptime: Float
  }

  input CreateUserInput {
    email: String!
    username: String!
    displayName: String
    bio: String
  }

  input UpdateUserInput {
    email: String
    username: String
    displayName: String
    bio: String
    avatar: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    excerpt: String
    published: Boolean = false
    tags: [String!] = []
  }

  input UpdatePostInput {
    title: String
    content: String
    excerpt: String
    published: Boolean
    tags: [String!]
  }
`;

export const resolvers = {
  Query: {
    hello: () => "Hello from GraphQL Yoga!",
    
    health: (_: any, __: any, context: any) => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: context.config?.version || "1.0.0",
      uptime: process.uptime(),
    }),

    users: async (_: any, __: any, context: any) => {
      try {
        const users = await context.db.user.findMany({
          orderBy: { createdAt: 'desc' }
        });
        return users;
      } catch (error) {
        context.logger.error("Failed to fetch users:", error);
        throw new Error("Failed to fetch users");
      }
    },

    user: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const user = await context.db.user.findUnique({
          where: { id }
        });
        return user;
      } catch (error) {
        context.logger.error(`Failed to fetch user ${id}:`, error);
        throw new Error("Failed to fetch user");
      }
    },

    posts: async (_: any, __: any, context: any) => {
      try {
        const posts = await context.db.post.findMany({
          orderBy: { createdAt: 'desc' },
          include: { author: true }
        });
        return posts;
      } catch (error) {
        context.logger.error("Failed to fetch posts:", error);
        throw new Error("Failed to fetch posts");
      }
    },

    post: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const post = await context.db.post.findUnique({
          where: { id },
          include: { author: true }
        });
        return post;
      } catch (error) {
        context.logger.error(`Failed to fetch post ${id}:`, error);
        throw new Error("Failed to fetch post");
      }
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const user = await context.db.user.create({
          data: {
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        return user;
      } catch (error) {
        context.logger.error("Failed to create user:", error);
        throw new Error("Failed to create user");
      }
    },

    updateUser: async (_: any, { id, input }: { id: string, input: any }, context: any) => {
      try {
        const user = await context.db.user.update({
          where: { id },
          data: {
            ...input,
            updatedAt: new Date(),
          }
        });
        return user;
      } catch (error) {
        context.logger.error(`Failed to update user ${id}:`, error);
        throw new Error("Failed to update user");
      }
    },

    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        await context.db.user.delete({
          where: { id }
        });
        return true;
      } catch (error) {
        context.logger.error(`Failed to delete user ${id}:`, error);
        return false;
      }
    },

    createPost: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Assuming we get authorId from auth context or input
        const post = await context.db.post.create({
          data: {
            ...input,
            authorId: context.user?.id, // This would come from auth middleware
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: { author: true }
        });
        return post;
      } catch (error) {
        context.logger.error("Failed to create post:", error);
        throw new Error("Failed to create post");
      }
    },

    updatePost: async (_: any, { id, input }: { id: string, input: any }, context: any) => {
      try {
        const post = await context.db.post.update({
          where: { id },
          data: {
            ...input,
            updatedAt: new Date(),
          },
          include: { author: true }
        });
        return post;
      } catch (error) {
        context.logger.error(`Failed to update post ${id}:`, error);
        throw new Error("Failed to update post");
      }
    },

    deletePost: async (_: any, { id }: { id: string }, context: any) => {
      try {
        await context.db.post.delete({
          where: { id }
        });
        return true;
      } catch (error) {
        context.logger.error(`Failed to delete post ${id}:`, error);
        return false;
      }
    },
  },

  User: {
    posts: async (parent: any, _: any, context: any) => {
      try {
        const posts = await context.db.post.findMany({
          where: { authorId: parent.id },
          orderBy: { createdAt: 'desc' }
        });
        return posts;
      } catch (error) {
        context.logger.error(`Failed to fetch posts for user ${parent.id}:`, error);
        return [];
      }
    },
  },

  Post: {
    author: async (parent: any, _: any, context: any) => {
      try {
        const author = await context.db.user.findUnique({
          where: { id: parent.authorId }
        });
        return author;
      } catch (error) {
        context.logger.error(`Failed to fetch author for post ${parent.id}:`, error);
        return null;
      }
    },
  },
};