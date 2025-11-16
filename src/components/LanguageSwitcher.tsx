import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = i18n.language || 'es'

  return (
    <div className="relative inline-block">
      <button
        onClick={() => changeLanguage(currentLanguage === 'en' ? 'es' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 hover:bg-black/60 transition-all duration-200 text-white"
        title={currentLanguage === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      >
        <Globe className="h-5 w-5" />
        <span className="font-medium uppercase">{currentLanguage}</span>
      </button>
    </div>
  )
}

export default LanguageSwitcher
