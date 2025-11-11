import { Prisma, prisma } from 'database';
import ContactUncheckedCreateInput = Prisma.ContactUncheckedCreateInput;

export class PrismaContactRepository {
  async create(data: ContactUncheckedCreateInput) {
    return prisma.contact.create({
      data
    })
  }
}
