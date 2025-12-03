import { type Contact, db } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useContactsDb() {
  async function getAll() {
    return db.contacts.toArray()
  }

  async function findById(id: string) {
    return db.contacts.get(id)
  }

  async function findByIds(ids: string[]) {
    return db.contacts.where('id').anyOf(ids).toArray()
  }

  async function update(contactId: string, contact: Partial<Contact>) {
    await db.contacts.upsert(contactId, contact)
    // Add to outbox for syncing
    await syncService.addToOutbox('contacts', 'update', contactId, contact)
  }

  async function insert(contact: Contact) {
    const contactId = await db.contacts.add(contact)
    // Add to outbox for syncing
    await syncService.addToOutbox('contacts', 'create', contactId, contact)
    return contactId
  }
  return { update, insert, getAll, findById, findByIds }
}
