import { useState, useMemo, useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Globe, Hash, Mail, MapPin, ShieldCheck, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import { useAlumniStore } from '../../stores/alumni.store'
import type { AlumniRegistration, Programme, House } from '../../types'

const ITEMS_PER_PAGE = 12

const programmeOptions = [
  { value: '', label: 'All Programmes' },
  { value: 'GENERAL_ARTS', label: 'General Arts' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'HOME_ECONOMICS', label: 'Home Economics' },
  { value: 'VISUAL_ARTS', label: 'Visual Arts' },
  { value: 'SCIENCE', label: 'Science' },
]

const houseOptions = [
  { value: '', label: 'All Houses' },
  { value: 'ACKAH', label: 'Ackah' },
  { value: 'DENSU', label: 'Densu' },
  { value: 'TANO', label: 'Tano' },
  { value: 'NKRUMAH', label: 'Nkrumah' },
  { value: 'PRA', label: 'Pra' },
  { value: 'VOLTA', label: 'Volta' },
]

const yearOptions = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 2024 - 1980 + 1 }, (_, i) => {
    const year = 1980 + i
    return { value: String(year), label: String(year) }
  }).reverse(),
]

const countryOptions = [
  { value: '', label: 'All Countries' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
]

/** Format UPPER_SNAKE enum values as Title Case for display */
function formatEnum(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function MemberAvatar({ member, size = 'md' }: { member: AlumniRegistration; size?: 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-28 w-28 text-4xl' : 'h-20 w-20 text-2xl'

  return (
    <div className="relative shrink-0">
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.fullName}
          className={`${sizeClass} border border-brand-950/10 object-cover dark:border-white/10`}
        />
      ) : (
        <div className={`${sizeClass} grid place-items-center border border-brand-950/10 bg-brand-950 text-cream-100 dark:border-white/10`}>
          <span className="font-black leading-none">{getInitials(member.fullName)}</span>
        </div>
      )}
      <span className="absolute bottom-0 right-0 h-4 w-4 border-2 border-cream-50 bg-emerald-500 dark:border-dark-card" />
    </div>
  )
}

function MemberFact({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string | number }) {
  return (
    <div className="min-w-0 border border-brand-950/10 bg-brand-950/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center gap-2 text-brand-950/40 dark:text-cream-100/40">
        <Icon size={14} />
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="truncate text-sm font-black text-brand-950 dark:text-gray-100">{value}</p>
    </div>
  )
}

function FeaturedMemberCard({ member, onOpen }: { member: AlumniRegistration; onOpen: () => void }) {
  const location = [member.city, member.country].filter(Boolean).join(', ') || 'Location not provided'

  return (
    <article className="admin-card-surface relative flex min-h-[26rem] flex-col overflow-hidden bg-brand-950 text-cream-100 dark:bg-dark-surface">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-cream-500" />
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 object-contain opacity-[0.035]"
      />
      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cream-100/60">
            <ShieldCheck size={14} className="text-emerald-400" />
            Featured record
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="grid h-10 w-10 place-items-center border border-white/10 bg-white/[0.06] text-cream-100/70 transition-colors hover:bg-cream-100 hover:text-brand-950"
            aria-label={`Open ${member.fullName}`}
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end">
          <MemberAvatar member={member} size="lg" />
          <div className="min-w-0">
            <h2 className="text-3xl font-black leading-tight text-white">{member.fullName}</h2>
            <p className="mt-2 text-base font-semibold text-cream-100/58">{member.occupation || member.employmentType ? member.occupation || formatEnum(member.employmentType) : 'Occupation not provided'}</p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cream-100/40">Academic lane</p>
            <p className="mt-2 text-lg font-black text-white">{formatEnum(member.programme)}</p>
            <p className="mt-1 text-sm font-semibold text-cream-100/52">Class of {member.yearGroup || 'N/A'} / {formatEnum(member.house)}</p>
          </div>
          <div className="border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cream-100/40">Location</p>
            <p className="mt-2 text-lg font-black text-white">{location}</p>
            <p className="mt-1 text-sm font-semibold text-cream-100/52">{member.isAvailableAsMentor ? 'Available for mentorship' : 'Member profile active'}</p>
          </div>
        </div>

        <div className="mt-auto pt-7">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex w-full items-center justify-between border border-cream-500/35 bg-cream-500/20 px-4 py-3 text-sm font-black text-cream-100 transition-colors hover:bg-cream-100 hover:text-brand-950"
          >
            Open full registration
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}

function MemberRecordCard({ member, onOpen }: { member: AlumniRegistration; onOpen: () => void }) {
  const location = [member.city, member.country].filter(Boolean).join(', ') || 'Location not provided'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-enter admin-card-surface group flex min-h-[17rem] w-full flex-col p-5 text-left transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <MemberAvatar member={member} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-brand-950 dark:text-gray-100">{member.fullName}</h3>
              <p className="mt-1 truncate text-sm font-semibold text-brand-950/52 dark:text-gray-400">
                {member.occupation || formatEnum(member.employmentType)}
              </p>
            </div>
            <ArrowRight size={18} className="mt-1 shrink-0 text-brand-950/25 transition-transform group-hover:translate-x-1 dark:text-cream-100/35" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-brand-950/[0.04] px-2.5 py-1 text-xs font-black text-brand-950/68 dark:bg-white/[0.05] dark:text-cream-100/72">
              <GraduationCap size={13} />
              {formatEnum(member.programme)} / {member.yearGroup || 'N/A'}
            </span>
            <span className="inline-flex bg-cream-100 px-2.5 py-1 text-xs font-black text-brand-950/68 dark:bg-white/[0.05] dark:text-cream-100/72">
              {formatEnum(member.house)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <MemberFact icon={MapPin} label="Location" value={location} />
        <MemberFact icon={Mail} label="Email" value={member.email} />
        <MemberFact icon={BriefcaseBusiness} label="Work" value={member.organization || 'Not provided'} />
        <MemberFact icon={Building2} label="Expertise" value={member.areaOfExpertise?.[0] || 'Not provided'} />
      </div>
    </button>
  )
}

export default function MembersDirectoryPage() {
  const navigate = useNavigate()
  const { registrations, fetchRegistrations } = useAlumniStore()
  const members = registrations.filter((r) => r.status === 'approved')

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState<string>('')
  const [houseFilter, setHouseFilter] = useState<string>('')
  const [countryFilter, setCountryFilter] = useState('')
  const [page, setPage] = useState(1)

  const stats = useMemo(() => {
    const countries = new Set(members.map((m) => m.country)).size
    const years = new Set(members.map((m) => m.yearGroup)).size
    const programmeCounts = members.reduce<Record<string, number>>((acc, m) => {
      acc[m.programme] = (acc[m.programme] ?? 0) + 1
      return acc
    }, {})
    const topProgrammeCount = Math.max(0, ...Object.values(programmeCounts))
    return { total: members.length, countries, years, topProgrammeCount }
  }, [members])

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase()
      const matchSearch = !q || m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      const matchYear = !yearFilter || String(m.yearGroup) === yearFilter
      const matchProgramme = !programmeFilter || m.programme === programmeFilter
      const matchHouse = !houseFilter || m.house === houseFilter
      const matchCountry = !countryFilter || m.country === countryFilter
      return matchSearch && matchYear && matchProgramme && matchHouse && matchCountry
    })
  }, [members, search, yearFilter, programmeFilter, houseFilter, countryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const featuredMember = paginated[0]
  const supportingMembers = paginated.slice(1)
  const openMember = (id: string) => navigate(`/alumni-registrations/${id}`)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="page-enter">
      <PageHeader
        title="Members Directory"
        description={`${members.length} approved members`}
      />

      <PageStats
        stats={[
          { label: 'Total Members', value: stats.total, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Top Programme', value: stats.topProgrammeCount, icon: GraduationCap, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Countries', value: stats.countries, icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
          { label: 'Year Groups', value: stats.years, icon: Hash, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        ]}
      />

      <section className="admin-card-surface mb-5 overflow-visible p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-950/45 dark:text-gray-500">Directory controls</p>
            <h2 className="mt-1 text-lg font-black text-brand-950 dark:text-gray-100">Find approved alumni records</h2>
          </div>
          <p className="text-xs font-bold text-brand-950/45 dark:text-gray-500">
            Showing {filtered.length} of {members.length}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_9rem_12rem_9rem_12rem]">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search name or email..."
            className="w-full"
          />
          <Select options={yearOptions} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1) }} className="w-full" />
          <Select options={programmeOptions} value={programmeFilter} onChange={(e) => { setProgrammeFilter(e.target.value as Programme | ''); setPage(1) }} className="w-full" />
          <Select options={houseOptions} value={houseFilter} onChange={(e) => { setHouseFilter(e.target.value as House | ''); setPage(1) }} className="w-full" />
          <Select options={countryOptions} value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }} className="w-full" />
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={search || yearFilter || programmeFilter || houseFilter || countryFilter ? 'No matching members' : 'No members found'}
          description={search || yearFilter || programmeFilter || houseFilter || countryFilter ? 'Try adjusting your search or filters.' : 'Approved alumni registrations will appear here as members.'}
        />
      ) : (
        <>
          <section className="mb-4 grid gap-5 xl:grid-cols-[minmax(22rem,0.82fr)_minmax(0,1.18fr)]">
            {featuredMember && (
              <FeaturedMemberCard member={featuredMember} onOpen={() => openMember(featuredMember.id)} />
            )}

            <div className="admin-card-surface overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-brand-950/10 bg-cream-100/60 p-5 dark:border-dark-border dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-950/45 dark:text-gray-500">Visible records</p>
                  <h2 className="mt-1 text-xl font-black text-brand-950 dark:text-gray-100">Member cards</h2>
                </div>
                <span className="w-fit border border-brand-950/10 bg-brand-950/[0.04] px-3 py-1.5 text-xs font-black text-brand-950/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100/60">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              {supportingMembers.length > 0 ? (
                <div className="grid gap-4 p-5 lg:grid-cols-2">
                  {supportingMembers.map((member) => (
                    <MemberRecordCard key={member.id} member={member} onOpen={() => openMember(member.id)} />
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <div className="border border-brand-950/10 bg-brand-950/[0.03] p-6 text-sm font-semibold text-brand-950/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                    Only one member matches the current filters.
                  </div>
                </div>
              )}
            </div>
          </section>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
