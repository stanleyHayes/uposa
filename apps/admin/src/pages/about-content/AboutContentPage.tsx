import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Save, Upload, FileText, X, ExternalLink } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

import Textarea from '../../components/ui/Textarea'
import RoleGate from '../../components/auth/RoleGate'
import { useAboutContentStore } from '../../stores/aboutContent.store'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/formatters'
import api from '../../api/client'

const aboutSchema = z.object({
  mission: z.string().min(10, 'Mission statement is required'),
  vision: z.string().min(10, 'Vision statement is required'),
  history: z.string().min(10, 'History is required'),
  constitutionUrl: z.string().url('Must be a valid URL').or(z.string().length(0)),
  constitutionSummary: z.string().min(10, 'Summary is required'),
  whatWeDo: z.string().min(10, 'Description is required'),
})

type AboutForm = z.infer<typeof aboutSchema>

export default function AboutContentPage() {
  const { content, updateContent } = useAboutContentStore()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      mission: content.mission,
      vision: content.vision,
      history: content.history,
      constitutionUrl: content.constitutionUrl,
      constitutionSummary: content.constitutionSummary,
      whatWeDo: content.whatWeDo,
    },
  })

  useEffect(() => {
    reset({
      mission: content.mission,
      vision: content.vision,
      history: content.history,
      constitutionUrl: content.constitutionUrl,
      constitutionSummary: content.constitutionSummary,
      whatWeDo: content.whatWeDo,
    })
  }, [content, reset])

  const onSubmit = async (data: AboutForm) => {
    if (!currentUser) return
    updateContent({ ...data, updatedBy: currentUser.name })
    addActivity({
      action: 'updated about content',
      targetType: 'About Content',
      targetId: 'about-content',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
    })
    toast.success('About content saved successfully')
    reset(data)
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File must be under 15MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('document', file)
      const res = await api.post('/admin/site/upload-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.data?.url
      if (url) {
        setValue('constitutionUrl', url, { shouldDirty: true })
        toast.success('PDF uploaded successfully')
      }
    } catch {
      toast.error('Failed to upload PDF')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const constitutionUrl = watch('constitutionUrl')

  return (
    <div>
      <PageHeader
        title="About / Company Info"
        description="Manage the association's public-facing content for the client website"
        actions={
          <RoleGate permission="content:edit">
            <Button
              leftIcon={<Save size={16} />}
              loading={isSubmitting}
              disabled={!isDirty}
              onClick={handleSubmit(onSubmit)}
            >
              Save Changes
            </Button>
          </RoleGate>
        }
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {/* Mission & Vision */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-brand-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Mission & Vision</h2>
          </div>
          <div className="space-y-4">
            <Textarea
              label="Mission Statement"
              rows={4}
              error={errors.mission?.message}
              {...register('mission')}
            />
            <Textarea
              label="Vision Statement"
              rows={4}
              error={errors.vision?.message}
              {...register('vision')}
            />
          </div>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">History</h2>
          <Textarea
            label="Founding Story & Timeline"
            rows={6}
            error={errors.history?.message}
            {...register('history')}
          />
        </div>

        {/* Constitution */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Constitution / Bylaws</h2>
          <div className="space-y-4">
            {/* PDF Upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Constitution PDF</label>
              {constitutionUrl ? (
                <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800/30">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-brand-600 dark:text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {constitutionUrl.split('/').pop() || 'Constitution.pdf'}
                    </p>
                    <a
                      href={constitutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      View PDF <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium px-2 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-800/30 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('constitutionUrl', '', { shouldDirty: true })}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-hover flex items-center justify-center">
                    <Upload size={18} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {uploading ? 'Uploading...' : 'Upload Constitution PDF'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">PDF up to 15MB</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              {/* Hidden field to keep constitutionUrl in the form */}
              <input type="hidden" {...register('constitutionUrl')} />
              {errors.constitutionUrl && <p className="text-red-500 text-xs mt-1">{errors.constitutionUrl.message}</p>}
            </div>
            <Textarea
              label="Constitution Summary"
              rows={4}
              error={errors.constitutionSummary?.message}
              {...register('constitutionSummary')}
            />
          </div>
        </div>

        {/* What We Do */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">What We Do</h2>
          <Textarea
            label="Description of Activities"
            rows={5}
            error={errors.whatWeDo?.message}
            {...register('whatWeDo')}
          />
        </div>

        {/* Last Updated */}
        {content.updatedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Last updated {formatDate(content.updatedAt)} by {content.updatedBy}
          </p>
        )}
      </div>
    </div>
  )
}
