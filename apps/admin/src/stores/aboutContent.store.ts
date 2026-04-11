import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AboutContent } from '../types'

const DEFAULT_CONTENT: AboutContent = {
  mission:
    'To foster unity, promote excellence, and create lasting bonds among past students of Opoku Ware School, while supporting the school\'s development and the welfare of its alumni community.',
  vision:
    'To be the most impactful old students\' association in Ghana, known for transforming lives, advancing education, and building a global network of distinguished Opoku Ware alumni.',
  history:
    'The Opoku Ware School Old Students Association (UPOSA) was founded in 1952, shortly after the establishment of Opoku Ware School. A group of pioneering old students recognized the need to maintain ties with their alma mater and give back to the institution that shaped them. Over the decades, UPOSA has grown from a small local group to a global alumni network spanning over 30 countries, with chapters in major cities across Africa, Europe, North America, and Asia.',
  constitutionUrl: 'https://uposa.org/documents/constitution-2023.pdf',
  constitutionSummary:
    'The UPOSA Constitution establishes the governance framework for the association. It defines membership criteria, the roles and responsibilities of elected executives, financial management procedures, disciplinary processes, and the process for amending the constitution. All members are bound by these bylaws.',
  whatWeDo:
    'UPOSA organizes annual homecoming events, provides scholarships to brilliant but needy students at Opoku Ware School, facilitates career networking among members, supports infrastructure projects at the school, and maintains an active mentorship programme connecting students with successful alumni.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'System',
}

interface AboutContentState {
  content: AboutContent
  updateContent: (updates: Partial<AboutContent>) => void
  resetToDefaults: () => void
}

export const useAboutContentStore = create<AboutContentState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      updateContent: (updates) =>
        set((s) => ({
          content: { ...s.content, ...updates, updatedAt: new Date().toISOString() },
        })),
      resetToDefaults: () => set({ content: DEFAULT_CONTENT }),
    }),
    { name: 'uposa_about_content' }
  )
)
