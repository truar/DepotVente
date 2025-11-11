import { db, type Contact } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useContactDb() {
  async function upsert(contact: Contact) {
    const contactId = await db.contacts.put(contact)
    // Add to outbox for syncing
    await syncService.addToOutbox('contacts', 'create', contactId, contact)
    return contactId
  }
  return { upsert }
}
