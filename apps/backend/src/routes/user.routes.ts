import type { FastifyInstance } from "fastify";
import type { CreateUserInput, UpdateUserInput } from "@cmr-apps/types";
import { UserService } from "../services/UserService";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";

// Instancier le service avec le repository
const userRepository = new PrismaUserRepository();
const userService = new UserService(userRepository);

export async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get("/api/users", async () => {
    return userService.getAllUsers();
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>(
    "/api/users/:id",
    async (request, reply) => {
      const { id } = request.params;
      const user = await userService.getUserById(id);

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
      const user = await userService.createUser(
        request.body as CreateUserInput
      );
      reply.code(201);
      return user;
    }
  );

  // Update user
  fastify.put<{ Params: { id: string }; Body: UpdateUserInput }>(
    "/api/users/:id",
    async (request, reply) => {
      const { id } = request.params;

      try {
        const user = await userService.updateUser(
          id,
          request.body as UpdateUserInput
        );
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
        await userService.deleteUser(id);
        reply.code(204);
        return;
      } catch (error) {
        reply.code(404);
        return { error: "User not found" };
      }
    }
  );
}
