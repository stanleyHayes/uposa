export interface Executive {
  id: string
  name: string
  position: string
  classOf: string
  email?: string
  phone?: string
  bio?: string
  photoUrl: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
