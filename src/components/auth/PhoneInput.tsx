import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'
import {
  DEFAULT_PHONE_COUNTRY,
  findPhoneCountry,
  PHONE_COUNTRIES,
  PhoneCountry,
  sanitizeNationalPhone,
} from '../../utils/countries'

interface PhoneInputProps {
  country: PhoneCountry
  phone: string
  onCountryChange: (country: PhoneCountry) => void
  onPhoneChange: (phone: string) => void
  required?: boolean
  disabled?: boolean
  id?: string
  label?: string
  error?: string
  inputClassName?: string
}

export default function PhoneInput({
  country,
  phone,
  onCountryChange,
  onPhoneChange,
  required = false,
  disabled = false,
  id,
  label = 'Phone Number',
  error,
  inputClassName,
}: PhoneInputProps) {
  const generatedId = useId()
  const phoneId = id ?? generatedId
  const countryListId = `${phoneId}-countries`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return PHONE_COUNTRIES

    return PHONE_COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.dial.includes(normalized) ||
        item.code.toLowerCase().includes(normalized)
    )
  }, [query])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const fieldClass =
    inputClassName ??
    'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:px-4 sm:py-3 sm:text-base'

  const selectCountry = (next: PhoneCountry) => {
    onCountryChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="space-y-1.5">
      <label htmlFor={phoneId} className="block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div
        className={clsx(
          'flex flex-col gap-2 sm:flex-row sm:items-stretch',
          error && 'rounded-lg ring-1 ring-red-500/40'
        )}
      >
        <div className="relative sm:w-[7.25rem] sm:shrink-0">
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={countryListId}
            onClick={() => setOpen((value) => !value)}
            className={clsx(
              fieldClass,
              'flex w-full items-center justify-between gap-2 px-3 sm:px-3',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">
                {country.flag}
              </span>
              <span className="truncate font-medium">{country.dial}</span>
            </span>
            <ChevronDown
              className={clsx('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          </button>

          {open && (
            <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:right-auto sm:w-[min(100vw-2rem,20rem)]">
              <div className="border-b border-gray-100 p-2 dark:border-gray-700">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search country"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <ul
                id={countryListId}
                role="listbox"
                aria-label="Country codes"
                className="max-h-56 overflow-y-auto overscroll-contain py-1"
              >
                {filteredCountries.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No countries found</li>
                ) : (
                  filteredCountries.map((item) => {
                    const selected = item.code === country.code
                    return (
                      <li key={item.code} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onClick={() => selectCountry(item)}
                          className={clsx(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition',
                            selected
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : 'text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700/60'
                          )}
                        >
                          <span className="text-base leading-none" aria-hidden="true">
                            {item.flag}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          <span className="shrink-0 font-medium text-gray-500 dark:text-gray-400">{item.dial}</span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <input
            id={phoneId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            value={phone}
            onChange={(event) => onPhoneChange(sanitizeNationalPhone(event.target.value))}
            placeholder="Enter phone number"
            aria-describedby={error ? `${phoneId}-error` : `${phoneId}-hint`}
            aria-invalid={Boolean(error)}
            className={clsx(
              fieldClass,
              'w-full min-w-0',
              error &&
                'border-red-500 bg-red-50/40 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/20 dark:focus:ring-red-500'
            )}
          />
        </div>
      </div>

      {!error && (
        <p id={`${phoneId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {country.flag} {country.name} ({country.dial})
        </p>
      )}

      {error && (
        <p id={`${phoneId}-error`} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export { DEFAULT_PHONE_COUNTRY, findPhoneCountry }
