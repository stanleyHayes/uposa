import { useEffect, useRef, useState } from 'react'
import {
  BookOpen, Save, Upload, FileText, X, ExternalLink, History, School, BarChart3,
  PlusCircle, Trash2, Eye, ListOrdered, ScrollText, Heart,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Card from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { useToast } from '../../hooks/useToast'
import { apiErrorMessage } from '../../utils/apiError'
import client from '../../api/client'

// About-page site-config keys (about:view / about:edit on the API). Site Config keeps the rest.
type TabKey = 'mission' | 'constitution' | 'history' | 'school' | 'stats' | 'stories'

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024

export default function AboutContentPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const canEdit = can('about:edit')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('mission')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [mission, setMission] = useState({ mission: '', vision: '' })
  const [stats, setStats] = useState({ members: 0, years: 0, projects: 0, events: 0 })
  const [history, setHistory] = useState<{ paragraphs: string[] }>({ paragraphs: [''] })
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string; abbreviation: string; founded: number; location: string; slogan: string;
    studentPopulation: number; teachingStaff: number;
    programs: Array<{ name: string; description: string }>;
    achievements: Array<{ year: string; description: string }>;
    notableAlumni: Array<{ name: string; achievement: string; yearGroup: string }>;
  }>({
    name: '', abbreviation: '', founded: 1960, location: '', slogan: '',
    studentPopulation: 0, teachingStaff: 0,
    programs: [], achievements: [], notableAlumni: [],
  })
  const [constitution, setConstitution] = useState<{ url: string; summary: string }>({ url: '', summary: '' })
  const [impactStories, setImpactStories] = useState<Array<{ name: string; quote: string; year: string }>>([])

  useEffect(() => {
    let cancelled = false
    const fetchConfigs = async () => {
      try {
        // Returns only the keys this admin may view (the About-page ones for about:view).
        const res = await client.get('/admin/site/config')
        if (cancelled) return
        const configs = res.data.data || {}
        if (configs.mission) setMission(configs.mission)
        if (configs.stats) setStats(configs.stats)
        if (configs.history) setHistory(configs.history)
        if (configs.schoolInfo) setSchoolInfo((prev) => ({ ...prev, ...configs.schoolInfo }))
        if (configs.impactStories) setImpactStories(configs.impactStories)
        if (configs.constitution) setConstitution({ url: configs.constitution.url ?? '', summary: configs.constitution.summary ?? '' })
      } catch (err) {
        if (!cancelled) toast.error(apiErrorMessage(err, 'Failed to load About content'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchConfigs()
    return () => { cancelled = true }
  }, [toast])

  const saveConfig = async (key: string, value: unknown) => {
    if (!currentUser) return
    setSaving(true)
    try {
      await client.put(`/admin/site/config/${key}`, { value })
      addActivity({ action: `updated About page ${key}`, targetType: 'About Content', targetId: key, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Saved', 'The public About page shows the change.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error('File must be under 15MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('document', file)
      const res = await client.post('/admin/site/upload-document', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data.data?.url as string | undefined
      if (url) {
        setConstitution((prev) => ({ ...prev, url }))
        toast.success('PDF uploaded', 'Save the constitution to publish it.')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to upload PDF'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const constitutionUrlInvalid = constitution.url !== '' && !constitution.url.startsWith('https://')

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'mission', label: 'Mission', icon: BookOpen },
    { key: 'constitution', label: 'Constitution', icon: ScrollText },
    { key: 'history', label: 'History', icon: History },
    { key: 'school', label: 'School', icon: School },
    { key: 'stats', label: 'Stats', icon: BarChart3 },
    { key: 'stories', label: 'Stories', icon: Heart },
  ]

  const updateHistoryParagraph = (index: number, value: string) => {
    const paragraphs = [...history.paragraphs]
    paragraphs[index] = value
    setHistory({ paragraphs })
  }

  const removeHistoryParagraph = (index: number) => {
    const paragraphs = history.paragraphs.length <= 1
      ? ['']
      : history.paragraphs.filter((_, i) => i !== index)
    setHistory({ paragraphs })
  }

  const addHistoryParagraph = () => {
    setHistory({ paragraphs: [...history.paragraphs, ''] })
  }

  const completedHistoryParagraphs = history.paragraphs.filter((paragraph) => paragraph.trim().length > 0)
  const historyWordCount = completedHistoryParagraphs.reduce((total, paragraph) => total + paragraph.trim().split(/\s+/).filter(Boolean).length, 0)

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="About Content" description="Content for the public About and Our School pages" />
        <div className="max-w-4xl">
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-6 pb-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-16 h-4" />)}
          </div>
          <div className="admin-card-surface p-6 space-y-5">
            <Skeleton className="w-40 h-5" />
            <Skeleton variant="rectangular" className="w-full h-24 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader title="About Content" description="Mission and vision, constitution, history, school details, homepage stats and impact stories shown on the public site" />

      <div className={activeTab === 'history' ? 'max-w-6xl' : 'max-w-4xl'}>
        {!canEdit && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">You can view this content but don't have permission to change it.</p>
        )}
        <div className="flex gap-0 border-b border-gray-200 dark:border-dark-border mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-brand-500 text-brand-500 dark:text-brand-300 dark:border-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Constitution Tab */}
        {activeTab === 'constitution' && (
          <Card title="Constitution">
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The About page's "Download Constitution" button links to this document. Upload a PDF or paste an https:// link.
              </p>
              {constitution.url ? (
                <div className="flex items-center justify-between gap-3 border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={18} className="shrink-0 text-red-500" />
                    <span className="truncate text-sm text-gray-800 dark:text-gray-200">{constitution.url.split('/').pop() || 'Constitution.pdf'}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={constitution.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setConstitution({ ...constitution, url: '' })}
                        title="Remove document"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">No constitution document is published.</p>
              )}
              {canEdit && (
                <>
                  <Button variant="secondary" leftIcon={<Upload size={14} />} loading={uploading} onClick={() => fileInputRef.current?.click()}>
                    {constitution.url ? 'Replace with uploaded PDF' : 'Upload Constitution PDF'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                </>
              )}
              <Input
                label="Or document URL"
                placeholder="https://..."
                value={constitution.url}
                readOnly={!canEdit}
                onChange={(e) => setConstitution({ ...constitution, url: e.target.value.trim() })}
                error={constitutionUrlInvalid ? 'Must be an https:// link' : undefined}
                helperText="PDF up to 15MB. Leave blank to remove the download button's document."
              />
              <Textarea
                label="Summary"
                rows={4}
                value={constitution.summary}
                readOnly={!canEdit}
                onChange={(e) => setConstitution({ ...constitution, summary: e.target.value })}
                placeholder="A short overview of what the constitution covers"
              />
              <div className="flex justify-end pt-2">
                <Button loading={saving} disabled={!canEdit || constitutionUrlInvalid} onClick={() => saveConfig('constitution', constitution)}>
                  <Save size={14} className="mr-1" /> Save Constitution
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Mission & Vision Tab */}
        {activeTab === 'mission' && (
          <Card title="Mission & Vision">
            <div className="space-y-4">
              <Textarea label="Mission Statement" rows={4} value={mission.mission} onChange={(e) => setMission({ ...mission, mission: e.target.value })} />
              <Textarea label="Vision Statement" rows={4} value={mission.vision} onChange={(e) => setMission({ ...mission, vision: e.target.value })} />
              <div className="flex justify-end pt-2">
                <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('mission', mission)}><Save size={14} className="mr-1" /> Save Mission & Vision</Button>
              </div>
            </div>
          </Card>
        )}

        {/* History Tab (NEW) */}
        {activeTab === 'history' && (
          <div className="space-y-5">
            <section className="admin-card-surface relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-cream-500" />
              <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-cream-500/20 to-transparent dark:from-white/[0.03] lg:block" />
              <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                <div>
                  <div className="mb-5 inline-flex items-center gap-3 border border-cream-500/30 bg-cream-500/15 px-4 py-2 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                    <History size={18} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-950/45 dark:text-gray-500">About page timeline</p>
                      <p className="text-sm font-bold">Organization History</p>
                    </div>
                  </div>
                  <h2 className="max-w-2xl text-2xl font-black leading-tight tracking-tight text-brand-950 dark:text-gray-100 md:text-3xl">
                    Shape the story visitors read before they meet the association.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-950/60 dark:text-gray-400">
                    Each paragraph becomes a separate timeline entry on the public About page. Keep entries focused, chronological, and easy to scan.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Entries', value: history.paragraphs.length, icon: ListOrdered },
                    { label: 'Filled', value: completedHistoryParagraphs.length, icon: FileText },
                    { label: 'Words', value: historyWordCount, icon: BarChart3 },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="border border-brand-950/10 bg-brand-950/[0.03] p-3 text-center dark:border-white/10 dark:bg-white/[0.03]">
                        <Icon size={17} className="mx-auto mb-2 text-cream-600 dark:text-cream-300" />
                        <p className="text-xl font-black text-brand-950 dark:text-gray-100">{item.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <section className="admin-card-surface overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-brand-950/10 bg-cream-100/60 px-5 py-4 dark:border-dark-border dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                      <FileText size={19} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-brand-950 dark:text-gray-100">Timeline entries</h3>
                      <p className="text-xs font-semibold text-brand-950/45 dark:text-gray-500">Edit the public story one entry at a time.</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" leftIcon={<PlusCircle size={15} />} onClick={addHistoryParagraph}>
                    Add Entry
                  </Button>
                </div>

                <div className="space-y-4 p-5">
                  {history.paragraphs.map((paragraph, idx) => (
                    <div key={idx} className="grid gap-3 border border-brand-950/10 bg-brand-950/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-[72px_minmax(0,1fr)_auto]">
                      <div>
                        <span className="inline-flex h-12 w-12 items-center justify-center border border-cream-500/35 bg-cream-500/20 text-lg font-black text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <Textarea
                          label={`Timeline paragraph ${idx + 1}`}
                          rows={4}
                          value={paragraph}
                          onChange={(e) => updateHistoryParagraph(idx, e.target.value)}
                          placeholder="Write a focused milestone, transition, or legacy moment..."
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-950/45 dark:text-gray-500">
                          <span>{paragraph.trim().split(/\s+/).filter(Boolean).length} words</span>
                          <span>{paragraph.trim().length} characters</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHistoryParagraph(idx)}
                        className="h-10 w-10 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-700 md:mt-6"
                        aria-label={`Remove history paragraph ${idx + 1}`}
                      >
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-brand-950/10 bg-cream-100/45 px-5 py-4 dark:border-dark-border dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-brand-950/50 dark:text-gray-500">
                    Save only when the entries are ready to publish on the About page.
                  </p>
                  <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('history', history)}>
                    <Save size={14} className="mr-1" /> Save History
                  </Button>
                </div>
              </section>

              <aside className="space-y-5 lg:sticky lg:top-24">
                <section className="admin-card-surface p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center border border-cream-500/35 bg-cream-500/20 text-brand-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-cream-100">
                      <Eye size={19} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Live shape</p>
                      <h3 className="text-lg font-black text-brand-950 dark:text-gray-100">About page preview</h3>
                    </div>
                  </div>

                  {completedHistoryParagraphs.length === 0 ? (
                    <div className="border border-brand-950/10 bg-brand-950/[0.03] p-4 text-sm leading-6 text-brand-950/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                      Add at least one paragraph to preview the history timeline.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedHistoryParagraphs.slice(0, 3).map((paragraph, idx) => (
                        <div key={`${idx}-${paragraph.slice(0, 12)}`} className="relative border-l border-brand-950/15 pb-4 pl-5 last:pb-0 dark:border-white/10">
                          <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 border border-brand-950/15 bg-cream-500 dark:border-white/10" />
                          <p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-brand-950/40 dark:text-gray-500">
                            Entry {idx + 1}
                          </p>
                          <p className="line-clamp-4 text-sm leading-6 text-brand-950/65 dark:text-gray-300">{paragraph}</p>
                        </div>
                      ))}
                      {completedHistoryParagraphs.length > 3 && (
                        <p className="border border-brand-950/10 bg-brand-950/[0.03] px-3 py-2 text-xs font-bold text-brand-950/45 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-500">
                          +{completedHistoryParagraphs.length - 3} more entr{completedHistoryParagraphs.length - 3 === 1 ? 'y' : 'ies'} in the full timeline
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="admin-card-surface p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Editorial rhythm</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      'One milestone or era per paragraph.',
                      'Put the earliest foundation story first.',
                      'Keep public-facing language warm and specific.',
                    ].map((tip) => (
                      <div key={tip} className="border border-brand-950/10 bg-brand-950/[0.03] p-3 text-sm font-semibold leading-5 text-brand-950/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                        {tip}
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}

        {/* School Info Tab (NEW) */}
        {activeTab === 'school' && (
          <div className="space-y-6">
            <Card title="School Details">
              <div className="grid grid-cols-2 gap-4">
                <Input label="School Name" value={schoolInfo.name} onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })} />
                <Input label="Abbreviation" value={schoolInfo.abbreviation} onChange={(e) => setSchoolInfo({ ...schoolInfo, abbreviation: e.target.value })} />
                <Input label="Founded" type="number" value={String(schoolInfo.founded)} onChange={(e) => setSchoolInfo({ ...schoolInfo, founded: Number(e.target.value) })} />
                <Input label="Location" value={schoolInfo.location} onChange={(e) => setSchoolInfo({ ...schoolInfo, location: e.target.value })} />
                <Input label="Slogan" value={schoolInfo.slogan} onChange={(e) => setSchoolInfo({ ...schoolInfo, slogan: e.target.value })} />
                <Input label="Student Population" type="number" value={String(schoolInfo.studentPopulation)} onChange={(e) => setSchoolInfo({ ...schoolInfo, studentPopulation: Number(e.target.value) })} />
                <Input label="Teaching Staff" type="number" value={String(schoolInfo.teachingStaff)} onChange={(e) => setSchoolInfo({ ...schoolInfo, teachingStaff: Number(e.target.value) })} />
              </div>
            </Card>

            <Card title="Academic Programs">
              <div className="space-y-3">
                {schoolInfo.programs.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4"><Input label="Program Name" value={p.name} onChange={(e) => { const u = [...schoolInfo.programs]; u[idx] = { ...p, name: e.target.value }; setSchoolInfo({ ...schoolInfo, programs: u }) }} /></div>
                    <div className="col-span-7"><Input label="Description" value={p.description} onChange={(e) => { const u = [...schoolInfo.programs]; u[idx] = { ...p, description: e.target.value }; setSchoolInfo({ ...schoolInfo, programs: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, programs: schoolInfo.programs.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, programs: [...schoolInfo.programs, { name: '', description: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Program</Button>
              </div>
            </Card>

            <Card title="Achievements & Legacy">
              <div className="space-y-3">
                {schoolInfo.achievements.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-2"><Input label="Year" value={a.year} onChange={(e) => { const u = [...schoolInfo.achievements]; u[idx] = { ...a, year: e.target.value }; setSchoolInfo({ ...schoolInfo, achievements: u }) }} /></div>
                    <div className="col-span-9"><Input label="Description" value={a.description} onChange={(e) => { const u = [...schoolInfo.achievements]; u[idx] = { ...a, description: e.target.value }; setSchoolInfo({ ...schoolInfo, achievements: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, achievements: schoolInfo.achievements.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, achievements: [...schoolInfo.achievements, { year: '', description: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Achievement</Button>
              </div>
            </Card>

            <Card title="Notable Alumni">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Distinguished graduates displayed on the Our School page.</p>
              <div className="space-y-3">
                {schoolInfo.notableAlumni.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3"><Input label="Name" value={a.name} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, name: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-5"><Input label="Achievement" value={a.achievement} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, achievement: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-3"><Input label="Year Group" value={a.yearGroup} onChange={(e) => { const u = [...schoolInfo.notableAlumni]; u[idx] = { ...a, yearGroup: e.target.value }; setSchoolInfo({ ...schoolInfo, notableAlumni: u }) }} /></div>
                    <div className="col-span-1"><button onClick={() => setSchoolInfo({ ...schoolInfo, notableAlumni: schoolInfo.notableAlumni.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setSchoolInfo({ ...schoolInfo, notableAlumni: [...schoolInfo.notableAlumni, { name: '', achievement: '', yearGroup: '' }] })}><PlusCircle size={14} className="mr-1" /> Add Notable Alumnus</Button>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('schoolInfo', schoolInfo)}><Save size={14} className="mr-1" /> Save School Info</Button>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <Card title="Homepage Statistics">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">These numbers appear on the public homepage as animated counters.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Total Alumni Members" type="number" value={String(stats.members)} onChange={(e) => setStats({ ...stats, members: Number(e.target.value) })} />
              <Input label="Years of Legacy" type="number" value={String(stats.years)} onChange={(e) => setStats({ ...stats, years: Number(e.target.value) })} />
              <Input label="Projects Completed" type="number" value={String(stats.projects)} onChange={(e) => setStats({ ...stats, projects: Number(e.target.value) })} />
              <Input label="Events Organized" type="number" value={String(stats.events)} onChange={(e) => setStats({ ...stats, events: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end pt-4">
              <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('stats', stats)}><Save size={14} className="mr-1" /> Save Stats</Button>
            </div>
          </Card>
        )}

        {/* Impact Stories Tab (NEW) */}
        {activeTab === 'stories' && (
          <Card title="Impact Stories / Testimonials">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Testimonials displayed on the Donate page to inspire contributions.</p>
            <div className="space-y-4">
              {impactStories.map((s, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4 border border-gray-100 dark:border-dark-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Story {idx + 1}</span>
                    <button onClick={() => setImpactStories(impactStories.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Name" value={s.name} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, name: e.target.value }; setImpactStories(u) }} />
                    <Input label="Year / Class" value={s.year} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, year: e.target.value }; setImpactStories(u) }} />
                  </div>
                  <Textarea label="Quote / Testimonial" rows={3} value={s.quote} onChange={(e) => { const u = [...impactStories]; u[idx] = { ...s, quote: e.target.value }; setImpactStories(u) }} />
                </div>
              ))}
              <Button variant="ghost" onClick={() => setImpactStories([...impactStories, { name: '', quote: '', year: '' }])}><PlusCircle size={14} className="mr-1" /> Add Story</Button>
            </div>
            <div className="flex justify-end pt-4">
              <Button loading={saving} disabled={!canEdit} onClick={() => saveConfig('impactStories', impactStories)}><Save size={14} className="mr-1" /> Save Stories</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
