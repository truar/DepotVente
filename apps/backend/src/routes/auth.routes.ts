import type { FastifyInstance } from "fastify";
import { UserService } from "../services/UserService";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";

// Instancier le service avec le repository
const userRepository = new PrismaUserRepository();
const userService = new UserService(userRepository);

export async function authRoutes(fastify: FastifyInstance) {
  // Sign in
  fastify.post("/signin", async (req, reply) => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await userService.verifyCredentials(email, password);

    if (!user) {
      reply.code(401);
      return { error: "Invalid credentials" };
    }

    const token = await fastify.jwt.sign({
      payload: { id: user.id },
    });

    reply.send({ token });
  });

  // Get current user (protected)
  fastify.get(
    "/protected",
    {
      onRequest: [fastify.authenticate],
    },
    async function (request, reply) {
      return request.user;
    }
  );

  // Logout (protected)
  fastify.post(
    "/logout",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      // Pour l'instant, on retourne simplement un succès
      // Plus tard, on pourra ajouter une blacklist de tokens ici
      reply.code(200);
      return { message: "Logged out successfully" };
    }
  );
}
