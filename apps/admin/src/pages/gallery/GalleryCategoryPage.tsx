import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Trash2, Images, X, CheckSquare, Square, Loader2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import RoleGate from '../../components/auth/RoleGate'
import { adminGalleryApi } from '../../api/services'
import { useActivityStore } from '../../stores/activity.store'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { GalleryCategory, GalleryItem } from '../../types'

export default function GalleryCategoryPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addActivity } = useActivityStore()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<GalleryCategory | null>(null)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Upload state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const [catRes, itemsRes] = await Promise.all([
        adminGalleryApi.getCategory(id),
        adminGalleryApi.list({ categoryId: id }),
      ])
      setCategory((catRes.data as any).data)
      setItems((itemsRes.data as any).data || [])
    } catch {
      toast.error('Failed to load category')
      navigate('/gallery', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, toast, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    return () => uploadPreviews.forEach(url => URL.revokeObjectURL(url))
  }, [uploadPreviews])

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const validFiles = files.filter(f => {
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)) {
        toast.error(`${f.name}: Only JPEG, PNG, GIF, WEBP allowed`)
        return false
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: Max 5MB`)
        return false
      }
      return true
    })
    setUploadFiles(prev => [...prev, ...validFiles])
    setUploadPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeUploadFile = (index: number) => {
    URL.revokeObjectURL(uploadPreviews[index])
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
    setUploadPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !id) {
      toast.error('Select at least one image')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      uploadFiles.forEach(f => formData.append('images', f))
      formData.append('categoryId', id)
      if (category) formData.append('category', category.name)

      await adminGalleryApi.upload(formData)

      if (currentUser) {
        addActivity({ action: `uploaded ${uploadFiles.length} image(s) to ${category?.name}`, targetType: 'gallery', targetId: id, performedBy: currentUser.id, performedByName: currentUser.name })
      }
      toast.success(`${uploadFiles.length} image(s) uploaded`)
      setShowUpload(false)
      setUploadFiles([])
      uploadPreviews.forEach(url => URL.revokeObjectURL(url))
      setUploadPreviews([])
      fetchData()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      await adminGalleryApi.delete(deleteTarget.id)
      addActivity({ action: 'deleted gallery image', targetType: deleteTarget.title, targetId: deleteTarget.id, performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success('Image deleted')
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('Failed to delete image')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !currentUser) return
    try {
      await adminGalleryApi.bulkDelete(Array.from(selectedIds))
      addActivity({ action: `deleted ${selectedIds.size} gallery image(s)`, targetType: 'gallery', targetId: '', performedBy: currentUser.id, performedByName: currentUser.name })
      toast.success(`${selectedIds.size} image(s) deleted`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      fetchData()
    } catch {
      toast.error('Failed to delete images')
    }
  }

  const toggleSelect = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const itemsPerPage = 12
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedItems.map(i => i.id)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-4">
        <button
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </button>
      </div>

      <PageHeader
        title={category?.name || 'Category'}
        description={category?.description || `${items.length} images`}
        actions={
          <RoleGate permission="content:create">
            <Button leftIcon={<ImagePlus size={16} />} onClick={() => setShowUpload(true)}>
              Add Images
            </Button>
          </RoleGate>
        }
      />

      {/* Upload Panel */}
      {showUpload && (
        <div className="mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Upload Images</h3>
            <button onClick={() => { setShowUpload(false); setUploadFiles([]); uploadPreviews.forEach(url => URL.revokeObjectURL(url)); setUploadPreviews([]) }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleFilesSelected} className="hidden" />

          {uploadFiles.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                {uploadPreviews.map((preview, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                    <img src={preview} alt={uploadFiles[i].name} className="w-full h-full object-cover" />
                    <button onClick={() => removeUploadFile(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">{uploadFiles[i].name}</p>
                  </div>
                ))}
                {/* Add more button */}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-border flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors cursor-pointer">
                  <ImagePlus size={18} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">More</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{uploadFiles.length} file(s) selected</p>
                <Button onClick={handleUpload} disabled={uploading} leftIcon={uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}>
                  {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} Image${uploadFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all">
              <ImagePlus size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Click to select images or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WEBP — max 5MB each — up to 20 at a time</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.size} selected</span>
          <RoleGate permission="content:delete">
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setBulkDeleteOpen(true)}>
              Delete Selected
            </Button>
          </RoleGate>
        </div>
      )}

      {/* Image Grid */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={<Images size={40} />}
            title="No images yet"
            description="Upload your first images to this category."
            action={
              <RoleGate permission="content:create">
                <Button leftIcon={<ImagePlus size={16} />} onClick={() => setShowUpload(true)}>
                  Add Images
                </Button>
              </RoleGate>
            }
          />
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-3">
              <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600 transition-colors">
                {selectedIds.size === paginatedItems.length && paginatedItems.length > 0
                  ? <CheckSquare size={18} className="text-brand-600" />
                  : <Square size={18} />
                }
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${items.length} images`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-xl overflow-hidden border transition-all duration-150 ${
                    selectedIds.has(item.id)
                      ? 'border-brand-500 ring-2 ring-brand-200'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(item.id)} className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-white/90 dark:bg-dark-card/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {selectedIds.has(item.id)
                      ? <CheckSquare size={14} className="text-brand-600" />
                      : <Square size={14} className="text-gray-400" />
                    }
                  </button>

                  {/* Delete button */}
                  <RoleGate permission="content:delete">
                    <button onClick={() => setDeleteTarget(item)} className="absolute top-2 right-2 z-10 w-6 h-6 rounded bg-white/90 dark:bg-dark-card/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </RoleGate>

                  {/* Image */}
                  <div className="aspect-square bg-gray-100 dark:bg-dark-hover">
                    <img src={item.imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                    {item.caption && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.caption}</p>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {items.length > itemsPerPage && (
          <div className="px-4 border-t border-gray-100 dark:border-dark-border">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(items.length / itemsPerPage)}
              totalItems={items.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Image" message={`Are you sure you want to delete "${deleteTarget?.title}"?`} confirmLabel="Delete" />
      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} title="Delete Selected Images" message={`Are you sure you want to delete ${selectedIds.size} image(s)?`} confirmLabel="Delete All" />
    </div>
  )
}
