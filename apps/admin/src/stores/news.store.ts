import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { News } from '../types'
import { MOCK_NEWS } from '../constants/mock-data/news.mock'

interface NewsState {
  articles: News[]
  addArticle: (article: Omit<News, 'id' | 'createdAt' | 'updatedAt'>) => News
  updateArticle: (id: string, updates: Partial<News>) => void
  deleteArticle: (id: string) => void
  resetToDefaults: () => void
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      articles: MOCK_NEWS,
      addArticle: (article) => {
        const newArticle: News = {
          ...article,
          id: `news-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: article.isPublished ? new Date().toISOString() : '',
        }
        set((s) => ({ articles: [newArticle, ...s.articles] }))
        return newArticle
      },
      updateArticle: (id, updates) =>
        set((s) => ({
          articles: s.articles.map((a) => {
            if (a.id !== id) return a
            const updated = { ...a, ...updates, updatedAt: new Date().toISOString() }
            if (updates.isPublished && !a.publishedAt) {
              updated.publishedAt = new Date().toISOString()
            }
            return updated
          }),
        })),
      deleteArticle: (id) =>
        set((s) => ({ articles: s.articles.filter((a) => a.id !== id) })),
      resetToDefaults: () => set({ articles: MOCK_NEWS }),
    }),
    { name: 'uposa_news', version: 2 }
  )
)
