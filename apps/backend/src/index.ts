import Fastify from 'fastify'
import cors from '@fastify/cors'
import { prisma } from 'database'
import type { CreateUserInput, UpdateUserInput } from 'types'
import 'dotenv/config'
const fastify = Fastify({
  logger: true
})

// Register CORS
await fastify.register(cors, {
  origin: true
})

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Get all users
fastify.get('/api/users', async () => {
  const users = await prisma.user.findMany()
  return users
})

// Get user by ID
fastify.get<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
  const { id } = request.params
  const user = await prisma.user.findUnique({
    where: { id }
  })

  if (!user) {
    reply.code(404)
    return { error: 'User not found' }
  }

  return user
})

// Create user
fastify.post<{ Body: CreateUserInput }>('/api/users', async (request, reply) => {
  const { firstName, lastName, email } = request.body

  const user = await prisma.user.create({
    data: { firstName, lastName, email }
  })

  reply.code(201)
  return user
})

// Update user
fastify.put<{ Params: { id: string }; Body: UpdateUserInput }>(
  '/api/users/:id',
  async (request, reply) => {
    const { id } = request.params
    const { firstName, lastName, email } = request.body

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { firstName, lastName, email }
      })
      return user
    } catch (error) {
      reply.code(404)
      return { error: 'User not found' }
    }
  }
)

// Delete user
fastify.delete<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
  const { id } = request.params

  try {
    await prisma.user.delete({
      where: { id }
    })
    reply.code(204)
    return
  } catch (error) {
    reply.code(404)
    return { error: 'User not found' }
  }
})

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']
signals.forEach(signal => {
  process.on(signal, async () => {
    await prisma.$disconnect()
    await fastify.close()
    process.exit(0)
  })
})

// Start server
try {
  await fastify.listen({
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000')
  })
} catch (err) {
  fastify.log.error(err)
  await prisma.$disconnect()
  process.exit(1)
}
