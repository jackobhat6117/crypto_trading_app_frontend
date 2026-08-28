import clsx from 'clsx'
import { getPasswordChecks } from '../../utils/password'

const RULES = [
  { key: 'minLength' as const, label: 'At least 8 characters' },
  { key: 'uppercase' as const, label: 'One uppercase letter' },
  { key: 'lowercase' as const, label: 'One lowercase letter' },
  { key: 'number' as const, label: 'One number' },
  { key: 'special' as const, label: 'One special character' },
]

export default function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null

  const checks = getPasswordChecks(password)

  return (
    <ul className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-800/60">
      {RULES.map((rule) => (
        <li
          key={rule.key}
          className={clsx(
            'text-xs',
            checks[rule.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {checks[rule.key] ? '✓' : '○'} {rule.label}
        </li>
      ))}
    </ul>
  )
}
