import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main content */}
      <div>
        <main>
          <div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
