import { type Contact, db } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useContactDb() {
  async function getAll() {
    return db.contacts.toArray()
  }

  async function findById(id: string) {
    return db.contacts.get(id)
  }

  async function upsert(contact: Contact) {
    const contactId = await db.contacts.put(contact)
    // Add to outbox for syncing
    await syncService.addToOutbox('contacts', 'create', contactId, contact)
    return contactId
  }
  return { upsert, getAll, findById }
}
