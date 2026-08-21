import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { LANGUAGES, authService } from '../../services/authService'

export const LANGUAGE_STORAGE_KEY = 'language'

/** Display order matches Base Trade. */
const LANGUAGE_ORDER = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru'] as const

export function getStoredLanguage(): string {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en'
}

interface LanguageModalProps {
  onClose: () => void
  onSelected?: (code: string) => void
}

export default function LanguageModal({ onClose, onSelected }: LanguageModalProps) {
  const [selected, setSelected] = useState(getStoredLanguage())
  const [saving, setSaving] = useState('')
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)

  const languages = useMemo(() => {
    const byCode = new Map(LANGUAGES.map((language) => [language.code, language]))
    return LANGUAGE_ORDER.map((code) => byCode.get(code)).filter(
      (language): language is (typeof LANGUAGES)[number] => Boolean(language)
    )
  }, [])

  const showToast = (message: string, ok: boolean) => {
    setToast({ message, ok })
    window.setTimeout(() => setToast(null), 2800)
  }

  const choose = async (code: string, name: string) => {
    if (saving) return
    setSaving(code)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    document.documentElement.lang = code
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
    setSelected(code)
    try {
      await authService.setLanguage(code)
      onSelected?.(code)
      showToast(`Language changed to ${name}`, true)
      window.setTimeout(onClose, 400)
    } catch {
      onSelected?.(code)
      showToast('Failed to update language', false)
    } finally {
      setSaving('')
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Language</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {languages.map((language) => {
              const active = selected === language.code
              const loading = saving === language.code
              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => choose(language.code, language.name)}
                  disabled={!!saving}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition ${
                    active
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                  } ${loading ? 'opacity-70' : ''}`}
                >
                  <span className="text-2xl leading-none">{language.flag}</span>
                  <span className="flex-1 font-medium">{language.name}</span>
                  {active && <Check className="ml-auto h-5 w-5 shrink-0" />}
                  {loading && !active && (
                    <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  )}
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Language preference is saved and will be used for chat and customer service
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[80] -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-xl ${
            toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>,
    document.body
  )
}
