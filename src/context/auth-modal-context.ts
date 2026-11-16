import { createContext } from 'react'

export interface AuthModalContextValue {
  isOpen: boolean
  isSignedIn: boolean
  openAuth: () => void
  closeAuth: () => void
  completeAuth: () => void
  signOut: () => void
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null)
