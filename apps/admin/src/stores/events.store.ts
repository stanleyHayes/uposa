import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Event } from '../types'
import { MOCK_EVENTS } from '../constants/mock-data/events.mock'

interface EventsState {
  events: Event[]
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  resetToDefaults: () => void
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: MOCK_EVENTS,
      addEvent: (event) => {
        const newEvent: Event = {
          ...event,
          id: `evt-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ events: [newEvent, ...s.events] }))
        return newEvent
      },
      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),
      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      resetToDefaults: () => set({ events: MOCK_EVENTS }),
    }),
    { name: 'uposa_events', version: 2 }
  )
)
