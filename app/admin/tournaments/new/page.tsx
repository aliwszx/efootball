import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTournament } from '@/app/actions/tournaments'

const inputCls = "w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-4 py-3 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/35 focus:bg-[#C50337]/8 outline-none"
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"

export default async function NewTournamentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-poppins)' }}>Yeni Turnir Yarat</h1>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[#C50337]/15 bg-[#C50337]/4 p-1">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/8 via-transparent to-transparent" />
          <form action={createTournament} className="rounded-[24px] border border-[#C50337]/10 bg-[#02060E] p-6 space-y-6 sm:p-8">

            {/* Əsas məlumatlar */}
            <div>
              <label className={labelCls}>Turnir adı</label>
              <input name="title" placeholder="Turnir adı" className={inputCls} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Platform</label>
                <select name="platform" className={inputCls} required>
                  <option value="">Platform seç</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Format</label>
                <select name="format" className={inputCls} required>
                  <option value="1v1">1v1</option>
                  <option value="2v2">2v2</option>
                </select>
              </div>
            </div>

            {/* Turnir növü */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Turnir Növü</p>

              <div>
                <label className={labelCls}>Format tipi</label>
                <select name="tournament_type" id="tournament_type_select" className={inputCls} required>
                  <option value="knockout_8">8 nəfərlik — Birbaşa Knockout</option>
                  <option value="group_knockout_16">16 nəfərlik — Qrup + Playoff</option>
                  <option value="swiss_36">36 nəfərlik — Swiss Liqa + Playoff</option>
                </select>
              </div>

              {/* Qrup tipi — yalnız group_knockout_16 üçün görünür */}
              <div id="group_legs_section" className="hidden">
                <label className={labelCls}>Qrup görüş sayı</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.12] has-[:checked]:border-[#C50337]/40 has-[:checked]:bg-[#C50337]/8">
                    <input type="radio" name="group_legs" value="1" defaultChecked className="mt-0.5 accent-[#C50337]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Tək görüş</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Hər komanda bir-biri ilə 1 dəfə</p>
                      <p className="text-xs text-zinc-600 mt-1">4 nəfərlik qrup: 6 matç</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.12] has-[:checked]:border-[#C50337]/40 has-[:checked]:bg-[#C50337]/8">
                    <input type="radio" name="group_legs" value="2" className="mt-0.5 accent-[#C50337]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Ev / Səfər</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Hər komanda bir-biri ilə 2 dəfə</p>
                      <p className="text-xs text-zinc-600 mt-1">4 nəfərlik qrup: 12 matç</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Swiss liqa matç sayı — yalnız swiss_36 üçün görünür */}
              <div id="league_match_section">
                <label className={labelCls}>Liqa matç sayı (hər oyunçu)</label>
                <input name="league_match_count" type="number" min="4" max="20" defaultValue="8" className={inputCls} />
                <p className="mt-1.5 text-xs text-zinc-600">36 nəfərlik üçün tövsiyə: 8 matç</p>
              </div>
            </div>

            {/* Oyunçu sayı */}
            <div>
              <label className={labelCls}>Maksimum oyunçu sayı</label>
              <input name="max_players" id="max_players_input" type="number" min="2" placeholder="36" className={inputCls} required />
              <p className="mt-1.5 text-xs text-zinc-600" id="max_players_hint">Format tipinə uyğun avtomatik doldurulur</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Giriş haqqı (₼)</label>
                <input name="entry_fee" type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Mükafat məbləği (₼)</label>
                <input name="prize_amount" type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Qeydiyyat son tarixi</label>
                <input name="registration_deadline" type="datetime-local" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Başlama vaxtı</label>
                <input name="start_time" type="datetime-local" className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select name="status" className={inputCls} required>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Qısa açıqlama</label>
              <textarea name="description" placeholder="Turnir haqqında qısa məlumat..." className={`${inputCls} min-h-24 resize-none`} />
            </div>

            <div>
              <label className={labelCls}>Turnir qaydaları</label>
              <textarea name="rules" placeholder="Qaydalar..." className={`${inputCls} min-h-32 resize-none`} />
            </div>

            <button type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3.5 font-semibold text-white shadow-lg shadow-[#C50337]/20 transition hover:scale-[1.01] hover:shadow-[#C50337]/35">
              Turnir yarat
            </button>
          </form>
        </div>
      </div>

      {/* Client-side JS: format seçiminə görə section-ları göstər/gizlə */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var sel = document.getElementById('tournament_type_select');
          var groupLegsSection = document.getElementById('group_legs_section');
          var leagueMatchSection = document.getElementById('league_match_section');
          var maxPlayersInput = document.getElementById('max_players_input');
          var maxPlayersHint = document.getElementById('max_players_hint');

          var defaults = {
            knockout_8: { players: 8, hint: '8 nəfərlik format — sabit' },
            group_knockout_16: { players: 16, hint: '16 nəfərlik format — 4 qrup × 4 oyunçu' },
            swiss_36: { players: 36, hint: '36 nəfərlik format — Swiss liqa' },
          };

          function update(val) {
            groupLegsSection.classList.toggle('hidden', val !== 'group_knockout_16');
            leagueMatchSection.classList.toggle('hidden', val !== 'swiss_36');
            var d = defaults[val];
            if (d) {
              maxPlayersInput.value = d.players;
              maxPlayersHint.textContent = d.hint;
            }
          }

          update(sel.value);
          sel.addEventListener('change', function() { update(this.value); });
        })();
      ` }} />
    </main>
  )
}
