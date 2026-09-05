import { ReactNode } from 'react'
import clsx from 'clsx'

export function fieldClassName(baseClass: string, hasError?: boolean) {
  return clsx(
    baseClass,
    hasError &&
      'border-red-500 bg-red-50/40 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/20 dark:focus:ring-red-500'
  )
}

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export default function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div aria-describedby={describedBy}>{children}</div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface FormAlertProps {
  message: string
  tone?: 'error' | 'info'
}

export function FormAlert({ message, tone = 'error' }: FormAlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'mb-4 rounded-lg px-4 py-3 text-sm',
        tone === 'error'
          ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400'
          : 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
      )}
    >
      {message}
    </div>
  )
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export type SignUpFieldErrors = {
  email?: string
  name?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

export function validateSignUpStep1(email: string): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {}
  const trimmed = email.trim()

  if (!trimmed) {
    errors.email = 'Please enter your email address'
  } else if (!isValidEmail(trimmed)) {
    errors.email = 'Please enter a valid email address'
  }

  return errors
}

export function validateSignUpStep2(
  name: string,
  phone: string,
  password: string,
  confirmPassword: string
): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {}

  if (!name.trim()) {
    errors.name = 'Please enter your full name'
  }

  if (!phone.replace(/\D/g, '')) {
    errors.phone = 'Please enter your phone number'
  }

  if (!password.trim()) {
    errors.password = 'Please enter a password'
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export function firstSignUpFieldId(errors: SignUpFieldErrors, step: 1 | 2) {
  if (step === 1) return errors.email ? 'email' : null

  const order: (keyof SignUpFieldErrors)[] = ['name', 'phone', 'password', 'confirmPassword']
  const hit = order.find((field) => errors[field])
  if (!hit) return null
  if (hit === 'name') return 'fullName'
  if (hit === 'phone') return 'phone'
  return hit
}
