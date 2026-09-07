import Fastify, {
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import clientContext from './plugins/client-context.js';
import datasetEpoch from './plugins/dataset-epoch.js';
import errorHandler from './plugins/error-handler.js';
import { authRoutes } from './routes/auth.routes.js';
import { replicationRoutes } from './routes/replication.route.js';
import { syncRoutes } from './routes/sync.routes.js';

// Étendre le type FastifyInstance pour inclure notre decorator
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export type AppOptions = {
  logger?: FastifyServerOptions['logger'];
  jwtSecret?: string;
};

// Builds the whole application without binding a port. index.ts calls it
// and listens; tests call it and use `app.inject()` (or listen on port 0).
export async function buildApp(options: AppOptions = {}) {
  const fastify = Fastify({
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(jwt, {
    secret: options.jwtSecret ?? process.env.JWT_SECRET ?? 'supersecret',
  });

  // Decorator d'authentification
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  );

  await fastify.register(clientContext);
  await fastify.register(errorHandler);
  await fastify.register(datasetEpoch);

  registerHealthCheck(fastify);

  // Register routes (all mounted under /api)
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(replicationRoutes, { prefix: '/api' });
  await fastify.register(syncRoutes, { prefix: '/api' });

  return fastify;
}

export type App = Awaited<ReturnType<typeof buildApp>>;

function registerHealthCheck(fastify: App) {
  // Event-loop lag: a timer that records how late it actually fires. Sustained
  // lag means the process is too busy to answer promptly - the symptom a load or
  // soak test needs to see, and invisible from outside the process.
  let eventLoopLagMs = 0;
  const INTERVAL_MS = 500;
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    eventLoopLagMs = Math.max(0, now - last - INTERVAL_MS);
    last = now;
  }, INTERVAL_MS);
  timer.unref();
  fastify.addHook('onClose', async () => clearInterval(timer));

  // Health check. Reports memory as well as liveness: container RSS drifts upward
  // from heap fragmentation even with no leak, so `docker stats` alone cannot tell
  // you whether a long run is leaking. heapUsed can.
  fastify.get('/api/health', async () => {
    const mem = process.memoryUsage();
    const mb = (bytes: number) => Math.round((bytes / 1048576) * 10) / 10;
    return {
      status: 'ok',
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
}
