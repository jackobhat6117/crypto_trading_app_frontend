import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, Clock, FileText, Upload, XCircle } from 'lucide-react'
import {
  DOCUMENT_TYPE_LABELS,
  KycDocumentType,
  KycRecord,
  KycSettings,
  KycStatus,
  kycService,
} from '../services/kycService'
import PageHeader from '../components/layout/PageHeader'
import { resolveMediaUrl } from '../utils/mediaUrl'

const STEPS = ['Personal Information', 'Identity Document', 'Selfie'] as const

const STATUS_COPY: Record<Exclude<KycStatus, 'not_submitted'>, { title: string; body: string }> = {
  pending: {
    title: 'KYC Verification Pending',
    body: 'Your documents have been received and are queued for review.',
  },
  under_review: {
    title: 'KYC Verification Under Review',
    body: 'Our compliance team is reviewing your documents. This usually takes less than 24 hours.',
  },
  approved: {
    title: 'KYC Verification Approved!',
    body: 'Your identity has been verified and all account features are unlocked.',
  },
  rejected: {
    title: 'KYC Verification Rejected',
    body: 'We could not verify your identity with the documents provided.',
  },
}

function FileField({
  label,
  file,
  onChange,
  icon,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  icon: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center dark:border-gray-700 dark:bg-gray-800">
        {file ? (
          <>
            <img src={URL.createObjectURL(file)} alt="" className="h-24 rounded-lg object-cover" />
            <span className="text-xs text-gray-500">{file.name}</span>
          </>
        ) : (
          <>
            {icon}
            <span className="text-sm text-gray-500">Tap to upload</span>
            <span className="text-xs text-gray-400">JPG or PNG, max 5MB</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export default function KycVerify() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<KycRecord | null>(null)
  const [settings, setSettings] = useState<KycSettings | null>(null)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [personal, setPersonal] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })
  const [documentType, setDocumentType] = useState<KycDocumentType>('passport')
  const [documentFront, setDocumentFront] = useState<File | null>(null)
  const [documentBack, setDocumentBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  useEffect(() => {
    Promise.all([kycService.getStatus().catch(() => null), kycService.getSettings().catch(() => null)])
      .then(([status, config]) => {
        setRecord(status)
        setSettings(config)
        if (config?.acceptedDocuments?.length) setDocumentType(config.acceptedDocuments[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const status = record?.status ?? 'not_submitted'

  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await kycService.submitStep1(personal)
      setStep(1)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not save your details. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentFront) {
      setError('Please upload the front of your document')
      return
    }
    setError('')
    setBusy(true)
    try {
      await kycService.submitStep2(documentType, documentFront, documentBack ?? undefined)
      if (settings?.requireSelfie === false) {
        setRecord(await kycService.getStatus())
      } else {
        setStep(2)
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not upload your document. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selfie) {
      setError('Please upload a selfie')
      return
    }
    setError('')
    setBusy(true)
    try {
      await kycService.submitStep3(selfie)
      setRecord(await kycService.getStatus())
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not upload your selfie. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="KYC Verification" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Loading...
        </div>
      </div>
    )
  }

  if (settings && !settings.enabled) {
    return (
      <div className="space-y-4">
        <PageHeader title="KYC Verification" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Identity verification is not currently required on this platform.
        </div>
      </div>
    )
  }

  if (status !== 'not_submitted') {
    const copy = STATUS_COPY[status]
    const icons = {
      approved: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />,
      rejected: <XCircle className="mx-auto h-14 w-14 text-red-500" />,
      pending: <Clock className="mx-auto h-14 w-14 text-amber-500" />,
      under_review: <Clock className="mx-auto h-14 w-14 text-amber-500" />,
    }

    return (
      <div className="space-y-4">
        <PageHeader title="KYC Verification" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          {icons[status]}
          <h2 className="mt-4 text-lg font-bold">{copy.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{copy.body}</p>
          {status === 'rejected' && record?.rejectionReason && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-left text-sm text-red-600 dark:bg-red-900/20">
              <span className="font-medium">Reason: </span>
              {record.rejectionReason}
            </div>
          )}
          {status === 'rejected' && (
            <button
              onClick={() => setRecord(null)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Resubmit Documents
            </button>
          )}
          {status === 'approved' && (
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Back to Profile
            </button>
          )}
        </div>

        {record?.selfie && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold">Submitted Documents</h3>
            <div className="flex gap-3">
              {[record.documentFront, record.documentBack, record.selfie].filter(Boolean).map((src) => (
                <img key={src} src={resolveMediaUrl(src!)} alt="" className="h-20 rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="KYC Verification" subtitle={STEPS[step]} />

      <div className="flex items-center gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                index <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
              }`}
            >
              {index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${index < step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
      )}

      {step === 0 && (
        <form
          onSubmit={submitStep1}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          {[
            { key: 'fullName' as const, label: 'Full Name', type: 'text', placeholder: 'As shown on your document' },
            { key: 'dateOfBirth' as const, label: 'Date of Birth', type: 'date', placeholder: '' },
            { key: 'address' as const, label: 'Address', type: 'text', placeholder: 'Street address' },
            { key: 'city' as const, label: 'City', type: 'text', placeholder: 'City' },
            { key: 'postalCode' as const, label: 'Postal Code', type: 'text', placeholder: 'Postal code' },
            { key: 'country' as const, label: 'Country', type: 'text', placeholder: 'Country' },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </label>
              <input
                type={field.type}
                required
                value={personal[field.key]}
                onChange={(e) => setPersonal({ ...personal, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Submitting...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 1 && (
        <form
          onSubmit={submitStep2}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(settings?.acceptedDocuments ?? (['passport', 'national_id', 'drivers_license'] as KycDocumentType[])).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDocumentType(type)}
                    className={`rounded-xl border px-2 py-3 text-xs font-medium ${
                      documentType === type
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
                        : 'border-gray-200 text-gray-500 dark:border-gray-700'
                    }`}
                  >
                    {DOCUMENT_TYPE_LABELS[type]}
                  </button>
                )
              )}
            </div>
          </div>
          <FileField
            label="Front of Document"
            file={documentFront}
            onChange={setDocumentFront}
            icon={<FileText className="h-8 w-8 text-gray-400" />}
          />
          {documentType !== 'passport' && (
            <FileField
              label="Back of Document"
              file={documentBack}
              onChange={setDocumentBack}
              icon={<FileText className="h-8 w-8 text-gray-400" />}
            />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold dark:border-gray-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? 'Uploading...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={submitStep3}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="text-sm text-gray-500">
            Take a photo of yourself holding your document. Make sure your face and the document are both clearly
            visible.
          </p>
          <FileField
            label="Selfie *"
            file={selfie}
            onChange={setSelfie}
            icon={<Camera className="h-8 w-8 text-gray-400" />}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold dark:border-gray-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? (
                'Uploading...'
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Submit
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">KYC Document Requirements</h3>
        <ul className="space-y-1 text-sm text-gray-500">
          {(settings?.requirements ?? [
            'Documents must be valid and not expired',
            'All four corners of the document must be visible',
            'Photos must be in colour, sharp and free of glare',
            'Details must match the personal information you entered',
          ]).map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-indigo-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
