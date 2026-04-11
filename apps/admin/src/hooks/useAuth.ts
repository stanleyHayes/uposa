import { useAuthStore } from '../stores/auth.store'

export function useAuth() {
  const { currentUser, isAuthenticated, isLoading, login, logout, updateCurrentUser, fetchMe } = useAuthStore()

  return { currentUser, isAuthenticated, isLoading, login, logout, updateCurrentUser, fetchMe }
}
