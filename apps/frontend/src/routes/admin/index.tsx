import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL!, // e.g. https://xyzcompany.supabase.co
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!, // anon key for browsers
  // optional options object here
)

export const Route = createFileRoute('/admin/')({
  component: Admin,
})

export function Admin() {
  const [notes, setNotes] = useState<any[] | null>(null)
  useEffect(() => {
    async function fetchNotes() {
      const { data: notes } = await supabase.from('notes').select()
      setNotes(notes)
    }
    fetchNotes()
  }, [])

  return <div>{JSON.stringify(notes, null, 2)}</div>
}
