import { useState, useMemo, useEffect } from 'react'
import { Users, MapPin, GraduationCap, Globe, Hash } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import { useAlumniStore } from '../../stores/alumni.store'
import type { Programme, House } from '../../types'

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

export default function MembersDirectoryPage() {
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="page-enter">
      <PageHeader
        title="Members Directory"
        description={`${members.length} approved members`}
      />

      <PageStats
        stats={[
          { label: 'Total Members', value: stats.total, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Top Programme', value: stats.topProgrammeCount, icon: GraduationCap, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Countries', value: stats.countries, icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
          { label: 'Year Groups', value: stats.years, icon: Hash, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search members..."
          className="w-64"
        />
        <Select options={yearOptions} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1) }} className="w-32" />
        <Select options={programmeOptions} value={programmeFilter} onChange={(e) => { setProgrammeFilter(e.target.value as Programme | ''); setPage(1) }} className="w-40" />
        <Select options={houseOptions} value={houseFilter} onChange={(e) => { setHouseFilter(e.target.value as House | ''); setPage(1) }} className="w-32" />
        <Select options={countryOptions} value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }} className="w-40" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={search || yearFilter || programmeFilter || houseFilter || countryFilter ? 'No matching members' : 'No members found'}
          description={search || yearFilter || programmeFilter || houseFilter || countryFilter ? 'Try adjusting your search or filters.' : 'Approved alumni registrations will appear here as members.'}
        />
      ) : (
        <>
          <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {paginated.map((member) => (
              <div
                key={member.id}
                className="card-enter card-lift bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_8px_30px_rgba(0,27,80,0.07)] hover:-translate-y-0.5 transition-all duration-300 ease-out p-4 flex items-start gap-4"
              >
                {/* Avatar with status ring */}
                <div className="relative shrink-0">
                  <img
                    src={member.photoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=001B50&color=FFF8DC&size=128&font-size=0.4`}
                    alt={member.fullName}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-card" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{member.fullName}</h3>
                  {member.occupation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{member.occupation}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                      <GraduationCap size={10} /> {formatEnum(member.programme)} &middot; {member.yearGroup}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                      {formatEnum(member.house)}
                    </span>
                  </div>
                  {(member.city || member.country) && (
                    <p className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{[member.city, member.country].filter(Boolean).join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
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
