import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { ReactElement } from 'react'

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />
  }
  return children
}
