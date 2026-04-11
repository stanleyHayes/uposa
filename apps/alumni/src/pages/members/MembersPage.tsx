import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Users, Search, MapPin, GraduationCap, Briefcase, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { membersApi } from '../../api/services'
import { formatEnum } from '../../utils/formatters'
import CustomSelect from '../../components/ui/CustomSelect'
import type { Member } from '../../types'

/* ─── Member Card ──────────────────────────────────────────── */

const cardAccents = [
  'from-primary/6 to-transparent',
  'from-secondary/6 to-transparent',
  'from-accent/6 to-transparent',
  'from-primary/4 to-transparent',
]

function MemberCard({ member, index }: { member: Member; index: number }) {
  const accent = cardAccents[index % cardAccents.length]

  return (
    <ScrollReveal delay={index * 0.03}>
      <Link to={`/members/${member.id}`} className="block h-full">
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="card relative overflow-hidden bg-base-100 border border-base-300/60 shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_12px_42px_rgba(0,27,80,0.08)] hover:border-primary/15 transition-all duration-300 h-full group"
        >
          {/* Top gradient accent */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent/80 to-primary/50" />

          {/* Decorative corner blob */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${accent} rounded-bl-[40px] pointer-events-none`} />

          <div className="p-5 flex flex-col items-center text-center relative flex-1">
            {/* Avatar with ring */}
            <div className="relative mb-3">
              <div className="ring-2 ring-primary/10 ring-offset-2 ring-offset-base-100 rounded-full">
                <Avatar src={member.photoUrl} name={member.fullName} size="lg" />
              </div>
            </div>

            {/* Name */}
            <h3 className="font-bold text-base leading-tight">{member.fullName}</h3>

            {/* Occupation */}
            {member.occupation && (
              <p className="text-sm text-base-content/55 flex items-center gap-1.5 mt-1">
                <Briefcase size={12} className="shrink-0 text-primary/35" />
                <span className="truncate max-w-[200px]">{member.occupation}</span>
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {member.yearGroup && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-primary/8 to-accent/5 text-primary/80 border border-primary/10">
                  <GraduationCap className="w-3 h-3" />
                  {member.yearGroup}
                </span>
              )}
              {member.house && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-secondary/8 text-secondary border border-secondary/10">
                  {formatEnum(member.house)}
                </span>
              )}
            </div>

            {/* Location */}
            {member.city && (
              <p className="text-xs text-base-content/45 flex items-center gap-1 mt-2.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {member.city}{member.country ? `, ${member.country}` : ''}
              </p>
            )}

            {/* View profile link */}
            <div className="mt-auto pt-3 border-t border-base-300/40 w-full">
              <span className="text-xs font-medium text-primary/60 group-hover:text-primary flex items-center justify-center gap-1 transition-colors">
                View Profile <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/12 to-transparent" />
        </motion.div>
      </Link>
    </ScrollReveal>
  )
}

/* ─── Main Page ────────────────────────────────────────────── */

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [houseFilter, setHouseFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 20 }
    if (search) params.search = search
    if (yearFilter) params.yearGroup = yearFilter
    if (houseFilter) params.house = houseFilter

    membersApi.directory(params)
      .then((res) => {
        const data = res.data.data
        setMembers(data || [])
        setTotalPages(res.data.pagination?.totalPages || 1)
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [page, search, yearFilter, houseFilter])

  return (
    <PageTransition>
      <PageHeader title="Alumni Directory" description="Connect with fellow UPOSA alumni" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Search by name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <input type="number" className="input input-sm input-bordered w-32" placeholder="Year group" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1) }} />
        <CustomSelect
          value={houseFilter}
          onChange={(v) => { setHouseFilter(v); setPage(1) }}
          placeholder="All Houses"
          className="w-40"
          options={[
            { value: 'ACKAH', label: 'Ackah' },
            { value: 'DENSU', label: 'Densu' },
            { value: 'TANO', label: 'Tano' },
            { value: 'NKRUMAH', label: 'Nkrumah' },
            { value: 'PRA', label: 'Pra' },
            { value: 'VOLTA', label: 'Volta' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Try adjusting your search filters" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {members.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="join">
                <button className="join-item btn btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <button className="join-item btn btn-sm">Page {page} of {totalPages}</button>
                <button className="join-item btn btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  )
}
