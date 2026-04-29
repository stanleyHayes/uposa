import { useEffect, useMemo, useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import PageHeader from '../../components/ui/PageHeader'
import ScrollReveal from '../../components/common/ScrollReveal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import { galleryApi } from '../../api/services'
import type { GalleryCategory, GalleryItem } from '../../types'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([galleryApi.list(), galleryApi.listCategories()])
      .then(([itemsRes, catsRes]) => {
        if (cancelled) return
        setItems(itemsRes.data.data || [])
        setCategories(catsRes.data.data || [])
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
        setCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!activeCategoryId) return items
    return items.filter((it) => it.categoryId === activeCategoryId)
  }, [items, activeCategoryId])

  return (
    <PageTransition>
      <SEO title="Gallery" description="Photos from UPOSA events, projects, and reunions." />
      <PageHeader title="Gallery" description="Moments from our community" />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveCategoryId('')}
            className={`btn btn-sm ${activeCategoryId === '' ? 'btn-primary' : 'btn-ghost'}`}
          >
            All
            <span className="badge badge-sm ml-1">{items.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`btn btn-sm ${activeCategoryId === cat.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {cat.name}
              {typeof cat.imageCount === 'number' && (
                <span className="badge badge-sm ml-1">{cat.imageCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No photos yet" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((item, i) => (
            <ScrollReveal key={item.id} delay={Math.min(i, 12) * 0.03}>
              <button
                type="button"
                onClick={() => setLightbox(item)}
                className="group relative block w-full aspect-square overflow-hidden rounded-2xl border border-primary/10 bg-base-200 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {(item.title || item.caption) && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent text-primary-content opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold line-clamp-2 text-left">
                      {item.caption || item.title}
                    </p>
                  </div>
                )}
              </button>
            </ScrollReveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightbox.imageUrl}
                alt={lightbox.title}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              {(lightbox.title || lightbox.caption) && (
                <div className="mt-3 text-primary-content text-center">
                  {lightbox.title && <h3 className="font-bold">{lightbox.title}</h3>}
                  {lightbox.caption && <p className="text-sm opacity-80">{lightbox.caption}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
