import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Users, Search, MapPin, GraduationCap } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { membersApi } from '../../api/services'
import { MOCK_MEMBERS } from '../../data/mock'
import { formatEnum } from '../../utils/formatters'
import type { Member } from '../../types'

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
        setMembers(data?.length ? data : MOCK_MEMBERS)
        setTotalPages(res.data.pagination?.totalPages || 1)
      })
      .catch(() => setMembers(MOCK_MEMBERS))
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
        <select className="select select-sm select-bordered" value={houseFilter} onChange={(e) => { setHouseFilter(e.target.value); setPage(1) }}>
          <option value="">All Houses</option>
          {['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'].map((h) => (
            <option key={h} value={h}>{formatEnum(h)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Try adjusting your search filters" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member, i) => (
              <ScrollReveal key={member.id} delay={i * 0.03}>
                <Link to={`/members/${member.id}`} className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow h-full">
                  <div className="card-body items-center text-center p-5">
                    <Avatar src={member.photoUrl} name={member.fullName} size="lg" />
                    <h3 className="font-semibold mt-2">{member.fullName}</h3>
                    {member.occupation && <p className="text-sm text-base-content/60">{member.occupation}</p>}
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {member.yearGroup && <span className="badge badge-ghost badge-sm"><GraduationCap className="w-3 h-3 mr-1" />{member.yearGroup}</span>}
                      {member.house && <span className="badge badge-outline badge-sm">{formatEnum(member.house)}</span>}
                    </div>
                    {member.city && <p className="text-xs text-base-content/50 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{member.city}{member.country ? `, ${member.country}` : ''}</p>}
                  </div>
                </Link>
              </ScrollReveal>
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
