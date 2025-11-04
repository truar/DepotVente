import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { db } from '@/db-client.ts'

export const Route = createFileRoute('/admin/')({
  component: Admin,
})

export function Admin() {
  const [notes, setNotes] = useState<any[] | null>(null)
  useEffect(() => {
    async function fetchNotes() {
      const notes = await db.notes.find().exec()
      setNotes(notes)
    }
    fetchNotes()
  }, [])

  return <div>{JSON.stringify(notes, null, 2)}</div>
}
