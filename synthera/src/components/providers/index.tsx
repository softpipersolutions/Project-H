'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './session-provider'
import { QueryProvider } from './query-provider'

interface Props {
  children: ReactNode
}

export function Providers({ children }: Props) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </AuthProvider>
  )
}