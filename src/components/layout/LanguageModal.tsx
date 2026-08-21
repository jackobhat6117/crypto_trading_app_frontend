import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { LANGUAGES, authService } from '../../services/authService'

export const LANGUAGE_STORAGE_KEY = 'language'

export function getStoredLanguage(): string {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en'
}

interface LanguageModalProps {
  onClose: () => void
}

export default function LanguageModal({ onClose }: LanguageModalProps) {
  const [selected, setSelected] = useState(getStoredLanguage())
  const [saving, setSaving] = useState('')

  const choose = async (code: string) => {
    setSelected(code)
    setSaving(code)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    document.documentElement.lang = code
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
    try {
      await authService.setLanguage(code)
    } catch {
      // The preference is stored locally regardless; the server sync can retry later.
    } finally {
      setSaving('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Language</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => choose(language.code)}
              disabled={!!saving}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
                selected === language.code
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <span className="flex-1 font-medium">{language.name}</span>
              {selected === language.code && <Check className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
