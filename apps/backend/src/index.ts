import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { prisma } from 'database';
import 'dotenv/config';
import jwt from '@fastify/jwt';

// Import des routes
import { authRoutes } from './routes/auth.routes';
import { replicationRoutes } from './routes/replication.route';
import { syncRoutes } from './routes/sync.routes';

// Étendre le type FastifyInstance pour inclure notre decorator
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

const fastify = Fastify({
  logger: true,
});

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Register JWT
await fastify.register(jwt, {
  secret: "supersecret",
});

// Decorator d'authentification
fastify.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
);

// Health check
fastify.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(authRoutes);
await fastify.register(replicationRoutes);
await fastify.register(syncRoutes);

// Graceful shutdown
const signals = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, async () => {
    await prisma.$disconnect();
    await fastify.close();
    process.exit(0);
  });
});

// Start server
try {
  await fastify.listen({
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "3000"),
  });
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}
