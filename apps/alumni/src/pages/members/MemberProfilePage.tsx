import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import PageTransition from '../../components/common/PageTransition'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { membersApi } from '../../api/services'
import { formatDate, formatEnum } from '../../utils/formatters'
import type { Member } from '../../types'

function DetailSkeleton() {
  return (
    <PageTransition>
      <div className="relative space-y-6">
        <div className="h-10 w-40 animate-pulse bg-base-300/40" />
        <div className="h-80 animate-pulse bg-base-300/45 rounded-[28px_6px_28px_6px]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          <div className="space-y-3">
            <div className="h-48 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
            <div className="h-40 animate-pulse bg-base-300/35 rounded-[24px_4px_24px_4px]" />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function MetaPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="border border-primary-content/10 bg-primary-content/[0.055] p-4 rounded-[18px_4px_18px_4px]">
      <span className="grid h-10 w-10 place-items-center bg-secondary/18 text-secondary rounded-[14px_3px_14px_3px]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-content/42">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-primary-content">{value}</p>
    </div>
  )
}

function DetailPanel({ icon: Icon, eyebrow, title, children }: { icon: LucideIcon; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-primary/8 text-primary rounded-[16px_3px_16px_3px]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{title}</h2>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-4 border-b border-primary/8 py-3 text-sm last:border-0">
      <span className="text-base-content/50">{label}</span>
      <span className="min-w-0 text-right font-bold text-base-content/76">{value}</span>
    </div>
  )
}

function NotFoundState() {
  return (
    <PageTransition>
      <div className="flex min-h-96 flex-col items-center justify-center border border-primary/10 bg-base-100/86 px-6 py-12 text-center shadow-[0_12px_34px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
        <span className="grid h-16 w-16 place-items-center bg-primary/8 text-primary rounded-[18px_4px_18px_4px]">
          <Users className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Member not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-base-content/55">
          This profile may no longer be visible in the directory.
        </p>
        <Link to="/members" className="btn btn-primary mt-6 min-h-11">
          <ArrowLeft className="h-4 w-4" />
          Back to directory
        </Link>
      </div>
    </PageTransition>
  )
}

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

  if (loading) return <DetailSkeleton />
  if (!member) return <NotFoundState />

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <Link to="/members" className="btn min-h-10 border-primary/10 bg-base-100 text-primary hover:bg-base-200 rounded-[14px_3px_14px_3px]">
          <ArrowLeft className="h-4 w-4" />
          Back to directory
        </Link>

        <section className="relative z-10 overflow-hidden bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)] rounded-[28px_6px_28px_6px]">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 object-contain opacity-[0.055]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />
          <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar src={member.photoUrl} name={member.fullName} size="xl" className="ring-4 ring-primary-content/12" />
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70 rounded-[14px_3px_14px_3px]">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    Directory profile
                  </div>
                  <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{member.fullName}</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-primary-content/62 sm:text-base">
                {member.occupation ? `${member.occupation}${member.organization ? ` at ${member.organization}` : ''}` : 'Alumni profile and directory record.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge status={member.membershipStatus} />
                {member.isAvailableAsMentor && <span className="badge badge-sm border-secondary/25 bg-secondary/15 text-secondary">Mentor</span>}
                {member.isVerified && <span className="badge badge-sm border-primary-content/15 bg-primary-content/10 text-primary-content/80">Verified</span>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetaPill icon={GraduationCap} label="Year group" value={member.yearGroup || 'N/A'} />
              <MetaPill icon={UserRound} label="House" value={member.house ? formatEnum(member.house) : 'N/A'} />
              <MetaPill icon={Briefcase} label="Work" value={member.occupation || 'N/A'} />
              <MetaPill icon={MapPin} label="Location" value={[member.city, member.country].filter(Boolean).join(', ') || 'N/A'} />
            </div>
          </div>
        </section>

        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <DetailPanel icon={GraduationCap} eyebrow="School record" title="Academic details">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <InfoRow label="Year group" value={member.yearGroup} />
                  <InfoRow label="Programme" value={member.programme ? formatEnum(member.programme) : undefined} />
                  <InfoRow label="House" value={member.house ? formatEnum(member.house) : undefined} />
                </div>
                <div className="border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <InfoRow label="Membership" value={<StatusBadge status={member.membershipStatus} />} />
                  <InfoRow label="Approved" value={member.isApproved ? 'Yes' : 'No'} />
                  <InfoRow label="Member since" value={formatDate(member.createdAt)} />
                </div>
              </div>
            </DetailPanel>

            <DetailPanel icon={Briefcase} eyebrow="Professional profile" title="Work and expertise">
              <div className="grid gap-4">
                <div className="border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <InfoRow label="Employment" value={member.employmentType ? formatEnum(member.employmentType) : undefined} />
                  <InfoRow label="Occupation" value={member.occupation} />
                  <InfoRow label="Organization" value={member.organization} />
                </div>
                {member.areaOfExpertise.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">Areas of expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {member.areaOfExpertise.map((area) => (
                        <span key={area} className="border border-primary/10 bg-primary/7 px-3 py-1.5 text-xs font-bold text-primary rounded-[12px_3px_12px_3px]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DetailPanel>

            {member.isAvailableAsMentor && member.mentorBio && (
              <DetailPanel icon={Handshake} eyebrow="Mentorship" title="Mentor bio">
                <p className="text-sm leading-relaxed text-base-content/64">{member.mentorBio}</p>
              </DetailPanel>
            )}
          </div>

          <aside className="space-y-4">
            <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
              <div className="h-1 bg-secondary" />
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Location</p>
                <h2 className="mt-2 text-xl font-bold">Current base</h2>
                <div className="mt-5 border border-primary/8 bg-base-200/35 p-4 rounded-[18px_4px_18px_4px]">
                  <MapPin className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-bold">{[member.city, member.region, member.country].filter(Boolean).join(', ') || 'Not listed'}</p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden border border-primary/10 bg-base-100/88 shadow-[0_14px_38px_rgba(0,27,80,0.06)] rounded-[24px_4px_24px_4px]">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-primary/8 text-primary rounded-[15px_3px_15px_3px]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Directory status</p>
                    <h2 className="mt-1 text-lg font-bold">Profile visibility</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-base-content/58">
                  <InfoRow label="Verified" value={member.isVerified ? 'Yes' : 'No'} />
                  <InfoRow label="Mentor" value={member.isAvailableAsMentor ? 'Available' : 'Not available'} />
                  <InfoRow label="WhatsApp member" value={member.isWhatsAppMember ? 'Yes' : 'No'} />
                </div>
              </div>
            </section>

            <section className="border border-primary/10 bg-primary p-5 text-primary-content shadow-[0_14px_38px_rgba(0,27,80,0.09)] rounded-[24px_4px_24px_4px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Network note</p>
              <p className="mt-3 text-sm leading-relaxed text-primary-content/62">
                Directory profiles show the alumni details members have chosen to keep visible.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-content/42">
                <CalendarDays className="h-4 w-4 text-secondary" />
                Updated {formatDate(member.updatedAt)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
