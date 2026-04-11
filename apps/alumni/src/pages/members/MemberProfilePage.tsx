import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, MapPin, Briefcase, GraduationCap } from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { membersApi } from '../../api/services'
import { formatDate, formatEnum } from '../../utils/formatters'
import type { Member } from '../../types'

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    membersApi.getById(id)
      .then((res) => setMember(res.data.data || null))
      .catch(() => setMember(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!member) return <div className="text-center py-16"><p>Member not found</p><Link to="/members" className="btn btn-primary mt-4">Back to Directory</Link></div>

  return (
    <PageTransition>
      <Link to="/members" className="btn btn-ghost btn-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to Directory</Link>

      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-[0_2px_8px_rgba(0,27,80,0.06)]">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar src={member.photoUrl} name={member.fullName} size="xl" />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{member.fullName}</h1>
                {member.occupation && <p className="text-base-content/60 mt-1">{member.occupation}{member.organization ? ` at ${member.organization}` : ''}</p>}
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <StatusBadge status={member.membershipStatus} />
                  {member.isAvailableAsMentor && <span className="badge badge-success badge-sm">Mentor</span>}
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Academic Info</h3>
                {member.yearGroup && <div className="flex justify-between text-sm"><span className="text-base-content/60">Year Group</span><span>{member.yearGroup}</span></div>}
                {member.programme && <div className="flex justify-between text-sm"><span className="text-base-content/60">Programme</span><span>{formatEnum(member.programme)}</span></div>}
                {member.house && <div className="flex justify-between text-sm"><span className="text-base-content/60">House</span><span>{formatEnum(member.house)}</span></div>}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> Professional Info</h3>
                {member.employmentType && <div className="flex justify-between text-sm"><span className="text-base-content/60">Employment</span><span>{formatEnum(member.employmentType)}</span></div>}
                {member.occupation && <div className="flex justify-between text-sm"><span className="text-base-content/60">Occupation</span><span>{member.occupation}</span></div>}
                {member.organization && <div className="flex justify-between text-sm"><span className="text-base-content/60">Organization</span><span>{member.organization}</span></div>}
              </div>

              {member.city && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</h3>
                  <p className="text-sm">{member.city}{member.country ? `, ${member.country}` : ''}</p>
                </div>
              )}

              {member.areaOfExpertise.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.areaOfExpertise.map((area) => (
                      <span key={area} className="badge badge-sm bg-[#FFF8DC] text-[#001B50]">{area}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {member.isAvailableAsMentor && member.mentorBio && (
              <>
                <div className="divider" />
                <div>
                  <h3 className="font-semibold mb-2">Mentor Bio</h3>
                  <p className="text-sm text-base-content/70">{member.mentorBio}</p>
                </div>
              </>
            )}

            <div className="text-xs text-base-content/40 mt-4">Member since {formatDate(member.createdAt)}</div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
