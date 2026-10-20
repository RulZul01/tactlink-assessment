import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// In-Memory Database Simulation
const users = [{ id: '1', email: 'test@test.com', password: 'password123' }];
let todos = [
  { id: '1', userId: '1', text: 'Finish technical assessment', completed: false },
  { id: '2', userId: '1', text: 'Deploy to Vercel', completed: true },
];

const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
  }

  type Todo {
    id: ID!
    userId: ID!
    text: String!
    completed: Boolean!
  }

  type Query {
    getTodos(userId: ID!): [Todo!]!
  }

  type Mutation {
    login(email: String!, password: String!): User
    signup(email: String!, password: String!): User
    createTodo(userId: ID!, text: String!): Todo!
    deleteTodo(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    getTodos: (_, { userId }) => todos.filter(t => t.userId === userId),
  },
  Mutation: {
    login: (_, { email, password }) => {
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid credentials');
      return user;
    },
    signup: (_, { email, password }) => {
      const existing = users.find(u => u.email === email);
      if (existing) throw new Error('User already exists');
      const newUser = { id: String(users.length + 1), email, password };
      users.push(newUser);
      return newUser;
    },
    createTodo: (_, { userId, text }) => {
      const newTodo = { id: String(Date.now()), userId, text, completed: false };
      todos.push(newTodo);
      return newTodo;
    },
    deleteTodo: (_, { id }) => {
      const initialLength = todos.length;
      todos = todos.filter(t => t.id !== id);
      return todos.length < initialLength;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`🚀 Server ready at: ${url}`);