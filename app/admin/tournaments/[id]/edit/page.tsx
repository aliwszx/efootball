import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateTournament } from '@/app/actions/tournaments'

const inputCls = "w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-4 py-3 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/35 focus:bg-[#C50337]/8 outline-none"
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500"

// datetime-local requires "YYYY-MM-DDTHH:MM" format
function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/login')

  const { data: t } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (!t) notFound()

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Turniri Düzəlt
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            ID: <span className="font-mono text-zinc-400">{t.id}</span>
          </p>
        </div>

        {/* Back link */}
        <Link href="/admin/tournaments"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Turnir siyahısına qayıt
        </Link>

        {/* Form card */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#C50337]/15 bg-[#C50337]/4 p-1">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/8 via-transparent to-transparent" />
          <form action={updateTournament} className="rounded-[24px] border border-[#C50337]/10 bg-[#02060E] p-6 space-y-5 sm:p-8">

            {/* Hidden tournament ID */}
            <input type="hidden" name="id" value={t.id} />

            <div>
              <label className={labelCls}>Turnir adı</label>
              <input name="title" defaultValue={t.title} placeholder="Turnir adı" className={inputCls} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Platform</label>
                <select name="platform" defaultValue={t.platform} className={inputCls} required>
                  <option value="">Platform seç</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Format</label>
                <select name="format" defaultValue={t.format} className={inputCls} required>
                  <option value="1v1">1v1</option>
                  <option value="2v2">2v2</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Giriş haqqı (₼)</label>
                <input name="entry_fee" type="number" step="0.01" min="0"
                  defaultValue={t.entry_fee} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Mükafat məbləği (₼)</label>
                <input name="prize_amount" type="number" step="0.01" min="0"
                  defaultValue={t.prize_amount} className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Maksimum oyunçu sayı</label>
              <input name="max_players" type="number" min="2"
                defaultValue={t.max_players} className={inputCls} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Qeydiyyat son tarixi</label>
                <input name="registration_deadline" type="datetime-local"
                  defaultValue={toDatetimeLocal(t.registration_deadline)} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Başlama vaxtı</label>
                <input name="start_time" type="datetime-local"
                  defaultValue={toDatetimeLocal(t.start_time)} className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select name="status" defaultValue={t.status} className={inputCls} required>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Qısa açıqlama</label>
              <textarea name="description" defaultValue={t.description || ''}
                placeholder="Turnir haqqında qısa məlumat..."
                className={`${inputCls} min-h-24 resize-none`} />
            </div>

            <div>
              <label className={labelCls}>Turnir qaydaları</label>
              <textarea name="rules" defaultValue={t.rules || ''}
                placeholder="Qaydalar..."
                className={`${inputCls} min-h-32 resize-none`} />
            </div>

            <div className="flex gap-3 pt-1">
              <Link href="/admin/tournaments"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.07] hover:text-white">
                Ləğv et
              </Link>
              <button type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C50337]/20 transition hover:scale-[1.01] hover:shadow-[#C50337]/35">
                Dəyişiklikləri saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
