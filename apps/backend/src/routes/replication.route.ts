import type { FastifyInstance } from 'fastify';
import { PrismaDepositRepository } from '../repositories/PrismaDepositRepository';
import { Prisma } from 'database';

import DepositUncheckedCreateInput = Prisma.DepositUncheckedCreateInput;
import ContactUncheckedCreateInput = Prisma.ContactUncheckedCreateInput;
import { PrismaContactRepository } from '../repositories/PrismaContactRepository';

type ReplicationRequest = {
  operationId: string
  collection: 'deposits' | 'contacts'
  operation: string
  recordId: string
  data: unknown
  timestamp: number
}

const depositRepository = new PrismaDepositRepository()
const contactRepository = new PrismaContactRepository()

export async function replicationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReplicationRequest }>('/push', async (request) => {
    const { operationId, collection, operation, data, timestamp } = request.body
    console.log(operationId, collection, operation, data, timestamp)
    if (collection === 'deposits') {
      let depositData = data as DepositUncheckedCreateInput
      await depositRepository.create({
        id: depositData.id,
        contributionStatus: depositData.contributionStatus? 'PAYER' : 'A_PAYER',
        createdAt: depositData.createdAt,
        updatedAt:depositData.updatedAt,
        depositIndex: depositData.depositIndex,
        eventId: depositData.eventId,
        sellerId: depositData.sellerId,
        workstationId: depositData.workstationId,
        deletedAt: null,
      })
    }
    if (collection === 'contacts') {
      let contactData = data as ContactUncheckedCreateInput
      await contactRepository.create({
        id: contactData.id,
        lastName: contactData.lastName,
        firstName: contactData.firstName,
        phoneNumber: contactData.phoneNumber,
        createdAt: contactData.createdAt,
        updatedAt: contactData.updatedAt,
        deletedAt: null,
      })
    }
  })
}
