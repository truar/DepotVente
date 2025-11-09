import { db, type User } from '@/db.ts'

export function useUserDb() {
  function upsert(user: User) {
    return db.users.put(user)
  }
  return { upsert }
}
