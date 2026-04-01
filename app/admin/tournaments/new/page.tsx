import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTournament } from '@/app/actions/tournaments'

export default async function NewTournamentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Yeni Turnir Yarat</h1>

        <form action={createTournament} className="space-y-4 rounded-2xl border p-6">
          <input
            name="title"
            placeholder="Turnir adi"
            className="w-full rounded-lg border p-3"
            required
          />

          <select name="platform" className="w-full rounded-lg border p-3" required>
            <option value="">Platform sec</option>
            <option value="PC">PC</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Xbox">Xbox</option>
            <option value="Mobile">Mobile</option>
          </select>

          <select name="format" className="w-full rounded-lg border p-3" required>
            <option value="1v1">1v1</option>
            <option value="2v2">2v2</option>
          </select>

          <input
            name="entry_fee"
            type="number"
            step="0.01"
            min="0"
            placeholder="Giris haqqi"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="prize_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Mukafat meblegi"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="max_players"
            type="number"
            min="2"
            placeholder="Maksimum oyunçu sayı"
            className="w-full rounded-lg border p-3"
            required
          />

          <label className="block">
            <span className="mb-1 block text-sm">Qeydiyyat son tarixi</span>
            <input
              name="registration_deadline"
              type="datetime-local"
              className="w-full rounded-lg border p-3"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm">Başlama vaxtı</span>
            <input
              name="start_time"
              type="datetime-local"
              className="w-full rounded-lg border p-3"
              required
            />
          </label>

          <select name="status" className="w-full rounded-lg border p-3" required>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="ongoing">Ongoing</option>
          </select>

          <textarea
            name="description"
            placeholder="Qısa açıqlama"
            className="min-h-28 w-full rounded-lg border p-3"
          />

          <textarea
            name="rules"
            placeholder="Turnir qaydaları"
            className="min-h-40 w-full rounded-lg border p-3"
          />

          <button className="w-full rounded-lg bg-black p-3 text-white">
            Turnir yarat
          </button>
        </form>
      </div>
    </main>
  )
}