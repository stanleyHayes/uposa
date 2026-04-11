import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Election, ElectionCandidate } from '../types'

const MOCK_ELECTIONS: Election[] = [
  {
    id: 'elec-1',
    title: '2025-2027 Executive Elections',
    description: 'Biennial election to elect the UPOSA Executive Council for the 2025-2027 term. All paid-up members in good standing are eligible to vote.',
    position: 'Executive Council',
    startDate: '2026-04-01',
    endDate: '2026-04-07',
    status: 'UPCOMING',
    candidates: [
      { id: 'nom-1', name: 'Dr. Nana Agyei', photoUrl: 'https://i.pravatar.cc/150?img=16', manifesto: 'My vision is a more inclusive UPOSA that reaches every corner of the diaspora and invests in our school\'s infrastructure.', votes: 0 },
      { id: 'nom-2', name: 'Ing. Samuel Darko', photoUrl: 'https://i.pravatar.cc/150?img=17', manifesto: 'I pledge to make UPOSA financially self-sustaining and build a dedicated alumni centre at Opoku Ware.', votes: 0 },
      { id: 'nom-3', name: 'Adwoa Sarpong-Asare', photoUrl: 'https://i.pravatar.cc/150?img=49', manifesto: 'I will expand the women in leadership programme and improve UPOSA\'s digital presence.', votes: 0 },
      { id: 'nom-5', name: 'Daniel Asamoah', photoUrl: 'https://i.pravatar.cc/150?img=23', manifesto: 'I will strengthen chapter operations nationwide and create a mentorship network connecting alumni with students.', votes: 0 },
      { id: 'nom-6', name: 'Yaw Frimpong', photoUrl: 'https://i.pravatar.cc/150?img=15', manifesto: 'I will continue to ensure transparent governance and complete the constitutional review process.', votes: 0 },
      { id: 'nom-7', name: 'Priscilla Donkor', photoUrl: 'https://i.pravatar.cc/150?img=54', manifesto: 'I will introduce quarterly financial reports and diversify UPOSA\'s revenue streams beyond dues and donations.', votes: 0 },
    ],
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'elec-2',
    title: '2023-2025 Executive Elections',
    description: 'Biennial election for the 2023-2025 UPOSA Executive Council. Held virtually and in-person at the annual general meeting in Kumasi.',
    position: 'Executive Council',
    startDate: '2023-04-03',
    endDate: '2023-04-08',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-4', name: 'Kwame Asante-Boateng', photoUrl: 'https://i.pravatar.cc/150?img=11', manifesto: 'I committed to restructuring UPOSA\'s finances, launching a digital membership portal, and growing our scholarship fund by 50%.', votes: 245 },
      { id: 'nom-8', name: 'Abena Mensah-Kusi', photoUrl: 'https://i.pravatar.cc/150?img=45', manifesto: 'I will bridge the gap between current students and alumni through mentorship and career programmes.', votes: 198 },
      { id: 'nom-9', name: 'Yaw Frimpong', photoUrl: 'https://i.pravatar.cc/150?img=15', manifesto: 'I will ensure meticulous record-keeping and transparent governance processes.', votes: 210 },
      { id: 'nom-10', name: 'Kofi Boakye-Mensah', photoUrl: 'https://i.pravatar.cc/150?img=12', manifesto: 'I will manage the association\'s finances with full transparency and accountability.', votes: 187 },
    ],
    createdAt: '2023-01-05T08:00:00.000Z',
    updatedAt: '2023-04-09T08:00:00.000Z',
  },
  {
    id: 'elec-3',
    title: '2021-2023 Executive Elections',
    description: 'Biennial election for the 2021-2023 UPOSA Executive Council. First election to include a virtual voting option.',
    position: 'Executive Council',
    startDate: '2021-04-05',
    endDate: '2021-04-10',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-11', name: 'Prince Adusei', photoUrl: 'https://i.pravatar.cc/150?img=13', manifesto: 'I will launch the digital alumni directory and establish a scholarship endowment fund.', votes: 312 },
      { id: 'nom-12', name: 'Mercy Aidoo', photoUrl: 'https://i.pravatar.cc/150?img=50', manifesto: 'I will establish annual health screening events and build partnerships with healthcare providers.', votes: 278 },
      { id: 'nom-13', name: 'Isaac Danquah', photoUrl: 'https://i.pravatar.cc/150?img=19', manifesto: 'I will bring organisational excellence to UPOSA operations and improve communication channels.', votes: 256 },
    ],
    createdAt: '2021-01-05T08:00:00.000Z',
    updatedAt: '2021-04-11T08:00:00.000Z',
  },
  {
    id: 'elec-4',
    title: '2019-2021 Executive Elections',
    description: 'Biennial election for the 2019-2021 UPOSA Executive Council. Held at the annual general meeting in Accra.',
    position: 'Executive Council',
    startDate: '2019-04-01',
    endDate: '2019-04-06',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-14', name: 'Francis Mensah', photoUrl: 'https://i.pravatar.cc/150?img=20', manifesto: 'I will create a comprehensive infrastructure renovation master plan and strengthen UPOSA\'s relationship with the school administration.', votes: 289 },
      { id: 'nom-15', name: 'Grace Appiah', photoUrl: 'https://i.pravatar.cc/150?img=51', manifesto: 'I will establish sound financial practices and ensure every cedi is accounted for.', votes: 267 },
    ],
    createdAt: '2019-01-05T08:00:00.000Z',
    updatedAt: '2019-04-07T08:00:00.000Z',
  },
  {
    id: 'elec-5',
    title: '2025-2027 Accra Chapter Elections',
    description: 'Election of Accra Chapter officers for the 2025-2027 term. Open to all Accra-based UPOSA members.',
    position: 'Accra Chapter Officers',
    startDate: '2025-02-01',
    endDate: '2025-02-07',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-16', name: 'Daniel Asamoah', photoUrl: 'https://i.pravatar.cc/150?img=23', manifesto: 'I will organise quarterly social events and double the chapter\'s active membership.', votes: 89 },
      { id: 'nom-17', name: 'Abigail Osei-Tutu', photoUrl: 'https://i.pravatar.cc/150?img=55', manifesto: 'I will lead the social media engagement strategy and organise networking events for young professionals.', votes: 76 },
      { id: 'nom-18', name: 'Augustine Mensah-Bonsu', photoUrl: 'https://i.pravatar.cc/150?img=24', manifesto: 'I will ensure clear communication and maintain an up-to-date member directory for the Accra Chapter.', votes: 82 },
    ],
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-02-08T08:00:00.000Z',
  },
  {
    id: 'elec-6',
    title: '2025-2027 UK Chapter Elections',
    description: 'Election of UK Chapter coordinator and committee members. Open to all UK-based UPOSA members.',
    position: 'UK Chapter Coordinator',
    startDate: '2025-03-15',
    endDate: '2025-03-22',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-19', name: 'Albert Owusu', photoUrl: 'https://i.pravatar.cc/150?img=18', manifesto: 'I will continue organising quarterly meetups and annual fundraising galas to support school projects.', votes: 45 },
      { id: 'nom-20', name: 'Felicia Owusu-Ansah', photoUrl: 'https://i.pravatar.cc/150?img=56', manifesto: 'I will ensure transparent management of UK Chapter funds and increase our contribution to school projects.', votes: 38 },
    ],
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-03-23T08:00:00.000Z',
  },
  {
    id: 'elec-7',
    title: '2026 UPOSA Foundation Board Election',
    description: 'Election of three new board members for the UPOSA Foundation, which manages scholarships and educational support programmes.',
    position: 'Foundation Board Member',
    startDate: '2026-05-01',
    endDate: '2026-05-07',
    status: 'UPCOMING',
    candidates: [
      { id: 'nom-21', name: 'Patricia Asiedu', photoUrl: 'https://i.pravatar.cc/150?img=53', manifesto: 'I will expand the scholarship programme to cover 20 students annually and introduce vocational training support.', votes: 0 },
      { id: 'nom-22', name: 'Josephine Appiah', photoUrl: 'https://i.pravatar.cc/150?img=49', manifesto: 'I will bring international fundraising expertise and establish partnerships with global education foundations.', votes: 0 },
      { id: 'nom-23', name: 'Emmanuel Adjei-Mensah', photoUrl: 'https://i.pravatar.cc/150?img=22', manifesto: 'I will ensure the Foundation addresses both academic and health needs of students through holistic support.', votes: 0 },
    ],
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'elec-8',
    title: '2017-2019 Executive Elections',
    description: 'Biennial election for the 2017-2019 UPOSA Executive Council. Held at the school campus in Kumasi.',
    position: 'Executive Council',
    startDate: '2017-04-03',
    endDate: '2017-04-08',
    status: 'COMPLETED',
    candidates: [
      { id: 'nom-24', name: 'Nana Osei', photoUrl: 'https://i.pravatar.cc/150?img=25', manifesto: 'I will professionalise UPOSA operations and establish strong corporate partnerships for school development.', votes: 345 },
      { id: 'nom-25', name: 'Samuel Tetteh', photoUrl: 'https://i.pravatar.cc/150?img=21', manifesto: 'I will oversee the water and sanitation project and begin planning for the sports complex.', votes: 298 },
    ],
    createdAt: '2017-01-05T08:00:00.000Z',
    updatedAt: '2017-04-09T08:00:00.000Z',
  },
]

interface ElectionsState {
  elections: Election[]
  addElection: (election: Omit<Election, 'id' | 'createdAt' | 'updatedAt'>) => Election
  updateElection: (id: string, updates: Partial<Election>) => void
  deleteElection: (id: string) => void
  addCandidate: (electionId: string, candidate: Omit<ElectionCandidate, 'id'>) => void
  updateCandidate: (electionId: string, candidateId: string, updates: Partial<ElectionCandidate>) => void
  deleteCandidate: (electionId: string, candidateId: string) => void
  resetToDefaults: () => void
}

export const useElectionsStore = create<ElectionsState>()(
  persist(
    (set) => ({
      elections: MOCK_ELECTIONS,
      addElection: (election) => {
        const newElection: Election = {
          ...election,
          id: `elec-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ elections: [newElection, ...s.elections] }))
        return newElection
      },
      updateElection: (id, updates) =>
        set((s) => ({
          elections: s.elections.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),
      deleteElection: (id) =>
        set((s) => ({ elections: s.elections.filter((e) => e.id !== id) })),
      addCandidate: (electionId, candidate) => {
        const newCandidate: ElectionCandidate = { ...candidate, id: `nom-${Date.now()}` }
        set((s) => ({
          elections: s.elections.map((e) =>
            e.id === electionId
              ? { ...e, candidates: [...e.candidates, newCandidate], updatedAt: new Date().toISOString() }
              : e
          ),
        }))
      },
      updateCandidate: (electionId, candidateId, updates) =>
        set((s) => ({
          elections: s.elections.map((e) =>
            e.id === electionId
              ? {
                  ...e,
                  candidates: e.candidates.map((c) =>
                    c.id === candidateId ? { ...c, ...updates } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      deleteCandidate: (electionId, candidateId) =>
        set((s) => ({
          elections: s.elections.map((e) =>
            e.id === electionId
              ? {
                  ...e,
                  candidates: e.candidates.filter((c) => c.id !== candidateId),
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),
      resetToDefaults: () => set({ elections: MOCK_ELECTIONS }),
    }),
    { name: 'uposa_elections', version: 2 }
  )
)
