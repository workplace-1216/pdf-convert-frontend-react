import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main>
        <div>
          {children}
        </div>
      </main>
    </div>
  )
}
