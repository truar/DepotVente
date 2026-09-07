import 'dotenv/config';
import { prisma } from 'database';
import { buildApp } from './app.js';

const fastify = await buildApp();

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
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
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
  });
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}
