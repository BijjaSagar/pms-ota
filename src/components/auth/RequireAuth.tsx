import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthModal } from '../../context/useAuthModal'

export function RequireAuth() {
  const { isSignedIn, openAuth } = useAuthModal()

  useEffect(() => {
    if (!isSignedIn) openAuth()
  }, [isSignedIn, openAuth])

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
