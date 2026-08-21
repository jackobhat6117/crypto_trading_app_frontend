import api from './api'

export type KycStatus = 'not_submitted' | 'pending' | 'under_review' | 'approved' | 'rejected'

export type KycDocumentType = 'passport' | 'national_id' | 'drivers_license'

export interface KycSettings {
  enabled: boolean
  requireSelfie: boolean
  acceptedDocuments: KycDocumentType[]
  requirements?: string[]
}

export interface KycRecord {
  _id: string
  status: KycStatus
  fullName?: string
  dateOfBirth?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  documentType?: KycDocumentType
  documentFront?: string
  documentBack?: string
  selfie?: string
  rejectionReason?: string
  submittedAt?: string
  reviewedAt?: string
}

export interface KycStep1Payload {
  fullName: string
  dateOfBirth: string
  address: string
  city: string
  postalCode: string
  country: string
}

export const DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  drivers_license: 'Driver License',
}

export const kycService = {
  async getSettings(): Promise<KycSettings> {
    const response = await api.get('/api/kyc/settings')
    const data = response.data?.settings ?? response.data ?? {}
    return {
      enabled: data.enabled ?? true,
      requireSelfie: data.requireSelfie ?? true,
      acceptedDocuments: data.acceptedDocuments ?? ['passport', 'national_id', 'drivers_license'],
      requirements: data.requirements,
    }
  },

  async getStatus(): Promise<KycRecord | null> {
    const response = await api.get('/api/kyc/status')
    return response.data?.kyc ?? response.data?.data ?? null
  },

  async submitStep1(payload: KycStep1Payload) {
    const response = await api.post('/api/kyc/step1', payload)
    return response.data
  },

  // Steps 2 and 3 upload files, so they must bypass the default JSON content type.
  async submitStep2(documentType: KycDocumentType, front: File, back?: File) {
    const form = new FormData()
    form.append('documentType', documentType)
    form.append('documentFront', front)
    if (back) form.append('documentBack', back)
    const response = await api.post('/api/kyc/step2', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async submitStep3(selfie: File) {
    const form = new FormData()
    form.append('selfie', selfie)
    const response = await api.post('/api/kyc/step3', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
