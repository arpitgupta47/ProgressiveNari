import { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('pn_lang') || 'en')

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en'
    setLang(newLang)
    localStorage.setItem('pn_lang', newLang)
  }

  const setLanguage = (l) => {
    setLang(l)
    localStorage.setItem('pn_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLanguage }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
