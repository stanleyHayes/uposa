import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, Images, Trash2, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import PageStats from '../../components/ui/PageStats'
import { PageSkeleton } from '../../components/ui/Skeleton'
import RoleGate from '../../components/auth/RoleGate'
import { adminGalleryApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { GalleryCategory } from '../../types'

export default function GalleryPage() {
  const navigate = useNavigate()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<GalleryCategory | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [createPreview, setCreatePreview] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminGalleryApi.listCategories()
      setCategories((res.data as any).data || [])
    } catch {
      toast.error('Failed to load gallery categories')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, WEBP allowed')
      return
    }
    setCreateImage(file)
    setCreatePreview(URL.createObjectURL(file))
  }

  const resetCreate = () => {
    setShowCreate(false)
    setCreateName('')
    setCreateDesc('')
    if (createPreview && createImage) URL.revokeObjectURL(createPreview)
    setCreateImage(null)
    setCreatePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('Category name is required')
      return
    }
    setCreating(true)
    try {
      const fd = new FormData()
      fd.append('name', createName.trim())
      if (createDesc.trim()) fd.append('description', createDesc.trim())
      if (createImage) fd.append('coverImage', createImage)

      await adminGalleryApi.createCategory(fd)

      if (currentUser) {
        addActivity({ action: 'created gallery category', targetType: createName, targetId: '', performedBy: currentUser.id, performedByName: currentUser.name })
      }
      toast.success('Category created')
      resetCreate()
      fetchCategories()
    } catch {
      toast.error('Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminGalleryApi.deleteCategory(deleteTarget.id)
      addActivity({ action: 'deleted gallery category', targetType: deleteTarget.name, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Category deleted')
      setDeleteTarget(null)
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const totalImages = categories.reduce((sum, c) => sum + (c.imageCount || 0), 0)

  if (loading) return <PageSkeleton cols={3} rows={2} />

  return (
    <div className="page-enter">
      <PageHeader
        title="Gallery"
        description={`${categories.length} categories, ${totalImages} images`}
        actions={
          <RoleGate permission="content:create">
            <Button leftIcon={<FolderPlus size={16} />} onClick={() => setShowCreate(true)}>
              New Category
            </Button>
          </RoleGate>
        }
      />

      <PageStats
        stats={[
          { label: 'Categories', value: categories.length, icon: Images, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
          { label: 'Total Images', value: totalImages, icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        ]}
      />

      {/* Create Category Panel */}
      {showCreate && (
        <div className="mb-6 admin-card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Category</h3>
            <button onClick={resetCreate} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Name *</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="e.g. Campus & Facilities" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none" rows={2} placeholder="Brief description of this category..." value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Cover Image</label>
              {createPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border aspect-[4/3]">
                  <img src={createPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { if (createPreview) URL.revokeObjectURL(createPreview); setCreateImage(null); setCreatePreview(''); }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors cursor-pointer">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Upload</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageSelected} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreate} disabled={creating} leftIcon={creating ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}>
              {creating ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </div>
      )}

      {/* Category Grid */}
      {categories.length === 0 ? (
        <div className="admin-card-surface">
          <EmptyState
            icon={<Images size={40} />}
            title="No gallery categories yet"
            description="Create your first category to start organizing images."
            action={
              <RoleGate permission="content:create">
                <Button leftIcon={<FolderPlus size={16} />} onClick={() => setShowCreate(true)}>
                  New Category
                </Button>
              </RoleGate>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group admin-card-surface overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              onClick={() => navigate(`/gallery/${cat.id}`)}
            >
              {/* Cover Image */}
              <div className="relative h-40 bg-gray-100 dark:bg-dark-hover overflow-hidden">
                {cat.coverImageUrl ? (
                  <img src={cat.coverImageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20">
                    <Images size={36} className="text-brand-300" />
                  </div>
                )}
                {/* Image count badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  {cat.imageCount || 0} image{(cat.imageCount || 0) !== 1 ? 's' : ''}
                </div>
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <RoleGate permission="content:delete">
                    <button onClick={() => setDeleteTarget(cat)} className="w-7 h-7 rounded-lg bg-white/90 dark:bg-dark-card/90 flex items-center justify-center shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </RoleGate>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Images in this category will be unlinked but not deleted.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
