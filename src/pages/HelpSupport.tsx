import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { supportService } from '../services/supportService'
import { useAuth } from '../contexts/AuthContext'

const FAQS = [
  {
    question: 'How do I create an account?',
    answer:
      'Click on the "Sign Up" button on the homepage, fill in your details, verify your email, and complete the KYC verification process.',
  },
  {
    question: 'How do I deposit funds?',
    answer:
      'Go to your profile, select "Deposits", choose your preferred payment method, enter the amount, and follow the instructions.',
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Withdrawal processing times vary by method. Bank transfers typically take 1-3 business days, while cryptocurrency withdrawals are usually processed within 24 hours.',
  },
  {
    question: 'What is KYC verification?',
    answer:
      'KYC (Know Your Customer) verification is a process to verify your identity. It helps us comply with regulations and protect your account from fraud.',
  },
  {
    question: 'How do I enable Two-Factor Authentication (2FA)?',
    answer:
      'Go to Settings > Enable 2FA, scan the QR code with an authenticator app, and verify the code to complete setup.',
  },
  {
    question: 'What should I do if I forget my password?',
    answer:
      'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email to reset your password.',
  },
  {
    question: 'Are my funds safe?',
    answer:
      'Yes, we use industry-standard security measures including encryption, cold storage for cryptocurrencies, and regular security audits.',
  },
  {
    question: 'What fees do you charge?',
    answer:
      'Fees vary by transaction type. Trading fees, withdrawal fees, and deposit fees are clearly displayed before you confirm any transaction.',
  },
]

export default function HelpSupport() {
  const { user, isAuthenticated } = useAuth()
  const [tab, setTab] = useState<'faq' | 'contact'>('faq')
  const [open, setOpen] = useState<number | null>(0)
  const [form, setForm] = useState({ email: user?.email ?? '', subject: '', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject || !form.message) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setBusy(true)
    try {
      await supportService.contact({
        name: user?.name ?? user?.username ?? '',
        email: form.email,
        subject: form.subject,
        message: form.message,
      })
      setSent(true)
      setForm({ email: form.email, subject: '', message: '' })
    } catch {
      setError('Failed to send your message. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="text-sm text-indigo-600">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Help &amp; Support</h1>
        <p className="mt-1 text-gray-500">Find answers to common questions or get in touch with our team.</p>

        <div className="mt-6 flex border-b border-gray-200 dark:border-gray-800">
          {(['faq', 'contact'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 text-sm font-medium ${
                tab === value ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'
              }`}
            >
              {value === 'faq' ? 'FAQ' : 'Contact Support'}
            </button>
          ))}
        </div>

        {tab === 'faq' ? (
          <div className="mt-6 space-y-2">
            {FAQS.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  onClick={() => setOpen(open === index ? null : index)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-medium"
                >
                  {faq.question}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                      open === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open === index && (
                  <p className="border-t border-gray-100 px-4 py-4 text-sm text-gray-500 dark:border-gray-800">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {isAuthenticated && (
              <Link
                to="/customer-service"
                className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-900/20"
              >
                <MessageCircle className="h-6 w-6 text-indigo-600" />
                <div>
                  <p className="font-medium text-indigo-900 dark:text-indigo-200">Open Live Chat</p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Chat with our support team in real time
                  </p>
                </div>
              </Link>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-semibold">Contact Support</h2>
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">
                  {error}
                </div>
              )}
              {sent && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
                  Your message has been sent. We&apos;ll get back to you shortly.
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="What is this about?"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help?"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Send Message'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Or email us directly at{' '}
                <a href="mailto:support@basetradedex.com" className="text-indigo-600">
                  support@basetradedex.com
                </a>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
