import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { prisma } from 'database';
import 'dotenv/config';
import jwt from '@fastify/jwt';

// Import des routes
import { authRoutes } from './routes/auth.routes.js';
import { replicationRoutes } from './routes/replication.route.js';
import { syncRoutes } from './routes/sync.routes.js';

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

// Event-loop lag: a timer that records how late it actually fires. Sustained
// lag means the process is too busy to answer promptly - the symptom a load or
// soak test needs to see, and invisible from outside the process.
let eventLoopLagMs = 0;
{
  const INTERVAL_MS = 500;
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    eventLoopLagMs = Math.max(0, now - last - INTERVAL_MS);
    last = now;
  }, INTERVAL_MS);
  timer.unref();
}

// Health check. Reports memory as well as liveness: container RSS drifts upward
// from heap fragmentation even with no leak, so `docker stats` alone cannot tell
// you whether a long run is leaking. heapUsed can.
fastify.get("/api/health", async () => {
  const mem = process.memoryUsage();
  const mb = (bytes: number) => Math.round((bytes / 1048576) * 10) / 10;
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMb: mb(mem.rss),
      heapUsedMb: mb(mem.heapUsed),
      heapTotalMb: mb(mem.heapTotal),
      externalMb: mb(mem.external),
    },
    eventLoopLagMs: Math.round(eventLoopLagMs * 10) / 10,
  };
});

// Register routes (all mounted under /api)
await fastify.register(authRoutes, { prefix: "/api" });
await fastify.register(replicationRoutes, { prefix: "/api" });
await fastify.register(syncRoutes, { prefix: "/api" });

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
