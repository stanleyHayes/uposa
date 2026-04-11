import { create } from 'zustand'
import type { Project } from '../types'
import client from '../api/client'

interface ProjectsState {
  projects: Project[]
  loading: boolean
  fetchProjects: () => Promise<void>
  addProject: (data: FormData) => Promise<Project>
  updateProject: (id: string, data: FormData) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>()((set) => ({
  projects: [],
  loading: false,
  fetchProjects: async () => {
    set({ loading: true })
    try {
      const res = await client.get('/projects')
      set({ projects: res.data.data || [] })
    } catch {
      set({ projects: [] })
    } finally {
      set({ loading: false })
    }
  },
  addProject: async (data: FormData) => {
    const res = await client.post('/projects/admin', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const project = res.data.data
    set((s) => ({ projects: [project, ...s.projects] }))
    return project
  },
  updateProject: async (id: string, data: FormData) => {
    const res = await client.put(`/projects/admin/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const updated = res.data.data
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }))
  },
  deleteProject: async (id: string) => {
    await client.delete(`/projects/admin/${id}`)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },
}))
