import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { prisma } from "database";
import type { CreateUserInput, UpdateUserInput } from "@cmr-apps/types";
import "dotenv/config";
import jwt from "@fastify/jwt";
import bcrypt from "bcrypt";
import { User } from "../../../packages/types/src/generated";
const fastify = Fastify({
  logger: true,
});

// Register CORS
await fastify.register(cors, {
  origin: true,
});

await fastify.register(jwt, {
  secret: "supersecret",
});
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

fastify.get(
  "/protected",
  {
    onRequest: [fastify.authenticate],
  },
  async function (request, reply) {
    return request.user;
  }
);

fastify.post("/signin", async (req, reply) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email , not: null},
      password: { not: null },
    },
  });
  if (!user) {
    reply.code(400);
    return { error: "User not found" };
  }
  const isPasswordValid = await bcrypt.compare(password, user.password!);
  if (!isPasswordValid) {
    reply.code(401);
    return { error: "Invalid password" };
  }
  const token = await fastify.jwt.sign({
    payload: { id: user.id },
  });
  reply.send({ token });
});

// Health check
fastify.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Get all users
fastify.get("/api/users", async () => {
  const users = await prisma.user.findMany();
  return users;
});

// Get user by ID
fastify.get<{ Params: { id: string } }>(
  "/api/users/:id",
  async (request, reply) => {
    const { id } = request.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }

    return user;
  }
);

// Create user
fastify.post<{ Body: CreateUserInput }>(
  "/api/users",
  async (request, reply) => {
    const { firstName, lastName, email } = request.body as CreateUserInput;

    const user = await prisma.user.create({
      data: { firstName, lastName, email },
    });

    reply.code(201);
    return user;
  }
);

// Update user
fastify.put<{ Params: { id: string }; Body: UpdateUserInput }>(
  "/api/users/:id",
  async (request, reply) => {
    const { id } = request.params;
    const { firstName, lastName, email } = request.body as UpdateUserInput;

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { firstName, lastName, email },
      });
      return user;
    } catch (error) {
      reply.code(404);
      return { error: "User not found" };
    }
  }
);

// Delete user
fastify.delete<{ Params: { id: string } }>(
  "/api/users/:id",
  async (request, reply) => {
    const { id } = request.params;

    try {
      await prisma.user.delete({
        where: { id },
      });
      reply.code(204);
      return;
    } catch (error) {
      reply.code(404);
      return { error: "User not found" };
    }
  }
);

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
