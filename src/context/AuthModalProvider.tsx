import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthModal } from '../components/auth/AuthModal'
import { AuthModalContext, type AuthModalContextValue } from './auth-modal-context'

const PROMPT_KEY = 'aurelia.auth.prompted.v1'
const SESSION_KEY = 'aurelia.auth.signed-in.v1'

function readSignedIn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === 'true') return false
      return !window.sessionStorage.getItem(PROMPT_KEY)
    } catch {
      return true
    }
  })
  const [isSignedIn, setIsSignedIn] = useState(readSignedIn)

  const openAuth = useCallback(() => setIsOpen(true), [])
  const closeAuth = useCallback(() => setIsOpen(false), [])

  const completeAuth = useCallback(() => {
    setIsSignedIn(true)
    setIsOpen(false)
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'true')
    } catch {
      // Session storage can be unavailable in private mode; the in-memory state still works.
    }
  }, [])

  const signOut = useCallback(() => {
    setIsSignedIn(false)
    setIsOpen(false)
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(PROMPT_KEY)
    } catch {
      // Session storage can be unavailable in private mode; the in-memory state still resets.
    }
  }, [])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PROMPT_KEY, 'true')
    } catch {
      // If storage is unavailable, the prompt still opened for this session.
    }
  }, [])

  const value = useMemo<AuthModalContextValue>(
    () => ({ isOpen, isSignedIn, openAuth, closeAuth, completeAuth, signOut }),
    [isOpen, isSignedIn, openAuth, closeAuth, completeAuth, signOut],
  )

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? <AuthModal onClose={closeAuth} onSuccess={completeAuth} /> : null}
    </AuthModalContext.Provider>
  )
}
