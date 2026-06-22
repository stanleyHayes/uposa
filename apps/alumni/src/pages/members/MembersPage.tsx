import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Filter,
  GraduationCap,
  Handshake,
  MapPin,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { membersApi } from '../../api/services'
import { formatEnum } from '../../utils/formatters'
import type { House, Member } from '../../types'

type HouseFilter = 'ALL' | House

const houseOptions: Array<{ value: House; label: string }> = [
  { value: 'ACKAH', label: 'Ackah' },
  { value: 'DENSU', label: 'Densu' },
  { value: 'TANO', label: 'Tano' },
  { value: 'NKRUMAH', label: 'Nkrumah' },
  { value: 'PRA', label: 'Pra' },
  { value: 'VOLTA', label: 'Volta' },
]

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'bg-primary-content/[0.06] text-secondary',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className={`grid h-10 w-10 place-items-center rounded-[14px_3px_14px_3px] ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary">{value}</p>
      <p className="mt-auto pt-2 text-xs font-semibold text-primary-content/45">{detail}</p>
    </div>
  )
}

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/48">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      to={`/members/${member.id}`}
      className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100/90 shadow-[0_14px_38px_rgba(0,27,80,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_55px_rgba(0,27,80,0.11)] rounded-[24px_4px_24px_4px]"
    >
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar src={member.photoUrl} name={member.fullName} size="lg" />
            {member.isAvailableAsMentor && (
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center border-2 border-base-100 bg-secondary text-primary rounded-[8px_2px_8px_2px]">
                <Handshake className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-lg font-bold leading-tight text-base-content">{member.fullName}</h2>
            {member.occupation && (
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-base-content/55">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/45" />
                <span className="truncate">{member.occupation}</span>
              </p>
            )}
            {member.organization && (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-base-content/38">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/35" />
                <span className="truncate">{member.organization}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <StatusBadge status={member.membershipStatus} />
          {member.isAvailableAsMentor && <span className="badge badge-sm border-secondary/20 bg-secondary/15 text-primary">Mentor</span>}
          {member.house && <span className="badge badge-sm border-primary/10 bg-primary/7 text-primary">{formatEnum(member.house)}</span>}
        </div>

        <div className="mt-5 grid gap-2 border-y border-primary/8 py-4">
          {member.yearGroup && <MetaItem icon={GraduationCap}>Year group {member.yearGroup}</MetaItem>}
          {member.programme && <MetaItem icon={Users}>{formatEnum(member.programme)}</MetaItem>}
          {(member.city || member.country) && (
            <MetaItem icon={MapPin}>
              {[member.city, member.country].filter(Boolean).join(', ')}
            </MetaItem>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
          <span className="text-sm font-bold text-base-content/42">
            {member.areaOfExpertise?.length ? `${member.areaOfExpertise.length} expertise area${member.areaOfExpertise.length === 1 ? '' : 's'}` : 'View profile'}
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-content rounded-[14px_3px_14px_3px]">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function DirectorySkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-base-300/40 rounded-[18px_4px_18px_4px]" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="border border-primary/8 bg-base-100/84 p-5 rounded-[24px_4px_24px_4px]">
            <div className="flex gap-4">
              <div className="h-14 w-14 animate-pulse bg-base-300/45 rounded-[18px_4px_18px_4px]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-4/5 animate-pulse bg-base-300/55" />
                <div className="h-3 w-3/5 animate-pulse bg-base-300/35" />
              </div>
            </div>
            <div className="mt-5 h-8 animate-pulse bg-base-300/30" />
            <div className="mt-4 h-20 animate-pulse bg-base-300/25" />
            <div className="mt-5 h-10 animate-pulse bg-base-300/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyDirectory({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
        <Users className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">No members found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
        {hasFilters ? 'Try clearing the search and filters.' : 'Approved alumni profiles will appear here.'}
      </p>
      {hasFilters && (
        <button type="button" className="btn btn-primary mt-6 min-h-11" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [houseFilter, setHouseFilter] = useState<HouseFilter>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMembers, setTotalMembers] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 20 }
    if (search.trim()) params.search = search.trim()
    if (yearFilter) params.yearGroup = yearFilter
    if (houseFilter !== 'ALL') params.house = houseFilter

    membersApi.directory(params)
      .then((res) => {
        setMembers(res.data.data || [])
        setTotalPages(res.data.pagination?.totalPages || 1)
        setTotalMembers(res.data.pagination?.total || 0)
      })
      .catch(() => {
        setMembers([])
        setTotalPages(1)
        setTotalMembers(0)
      })
      .finally(() => setLoading(false))
  }, [page, search, yearFilter, houseFilter])

  const hasFilters = Boolean(search.trim() || yearFilter || houseFilter !== 'ALL')
  const mentorsOnPage = members.filter((member) => member.isAvailableAsMentor).length
  const yearGroupsOnPage = useMemo(() => new Set(members.map((member) => member.yearGroup).filter(Boolean)).size, [members])
  const countriesOnPage = useMemo(() => new Set(members.map((member) => member.country).filter(Boolean)).size, [members])

  const clearFilters = () => {
    setSearch('')
    setYearFilter('')
    setHouseFilter('ALL')
    setPage(1)
  }

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-4 w-4 text-secondary" />
                Alumni directory
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Find old students by year, house, work, and location.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                Search approved alumni profiles, discover mentors, and open member records without losing the rhythm of the directory.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile icon={Users} label="Directory" value={totalMembers || members.length} detail="Approved profiles" />
              <StatTile icon={Handshake} label="Mentors" value={mentorsOnPage} detail="Visible on this page" tone="bg-secondary/18 text-primary" />
              <StatTile icon={GraduationCap} label="Year groups" value={yearGroupsOnPage} detail="In current view" />
              <StatTile icon={MapPin} label="Countries" value={countriesOnPage} detail="In current view" />
            </div>
          </div>
        </section>

        <section className="relative z-10 border border-primary/10 bg-base-100/88 p-4 shadow-[0_12px_34px_rgba(0,27,80,0.05)] rounded-[24px_4px_24px_4px]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_minmax(0,1.15fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/38" />
              <input
                type="text"
                className="input input-bordered h-12 w-full border-primary/10 bg-base-100 pl-11 text-sm focus:border-primary"
                placeholder="Search by name..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </label>

            <input
              type="number"
              className="input input-bordered h-12 w-full border-primary/10 bg-base-100 text-sm focus:border-primary"
              placeholder="Year group"
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value)
                setPage(1)
              }}
            />

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                className={`btn btn-sm min-h-10 shrink-0 gap-2 ${houseFilter === 'ALL' ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                onClick={() => {
                  setHouseFilter('ALL')
                  setPage(1)
                }}
              >
                <Filter className="h-4 w-4" />
                All houses
              </button>
              {houseOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn btn-sm min-h-10 shrink-0 ${houseFilter === option.value ? 'btn-primary' : 'border-primary/10 bg-base-200 text-primary hover:bg-base-300'}`}
                  onClick={() => {
                    setHouseFilter(option.value)
                    setPage(1)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button type="button" className="btn min-h-12 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={clearFilters} disabled={!hasFilters}>
              Clear
            </button>
          </div>
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Member records</p>
              <h2 className="mt-1 text-2xl font-bold">Alumni profiles</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-base-content/52">
              Showing page {page} of {totalPages}. Use filters to narrow the network quickly.
            </p>
          </div>

          {loading ? (
            <DirectorySkeleton />
          ) : members.length === 0 ? (
            <EmptyDirectory hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border border-primary/10 bg-base-100/88 p-3 shadow-[0_10px_28px_rgba(0,27,80,0.04)] sm:flex-row sm:items-center sm:justify-between rounded-[20px_4px_20px_4px]">
                  <p className="text-sm font-semibold text-base-content/52">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button className="btn min-h-11 border-primary/10 bg-base-200 text-primary hover:bg-base-300" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button className="btn btn-primary min-h-11" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
