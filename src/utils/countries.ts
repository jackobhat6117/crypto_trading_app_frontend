import countryTelephoneData from 'country-telephone-data'

const allCountries = countryTelephoneData.allCountries

export interface PhoneCountry {
  code: string
  name: string
  dial: string
  flag: string
}

function isoToFlag(iso2: string) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

function cleanCountryName(raw: string) {
  return raw.split(' (')[0].trim()
}

export const PHONE_COUNTRIES: PhoneCountry[] = allCountries
  .map((country) => ({
    code: country.iso2.toUpperCase(),
    name: cleanCountryName(country.name),
    dial: `+${country.dialCode}`,
    flag: isoToFlag(country.iso2),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const DEFAULT_PHONE_COUNTRY =
  PHONE_COUNTRIES.find((country) => country.code === 'US') ?? PHONE_COUNTRIES[0]

export function findPhoneCountry(code: string) {
  return PHONE_COUNTRIES.find((country) => country.code === code)
}

export function sanitizeNationalPhone(value: string) {
  return value.replace(/[^\d\s-]/g, '')
}

export function buildFullPhoneNumber(country: PhoneCountry, nationalNumber: string) {
  const digits = nationalNumber.replace(/\D/g, '')
  if (!digits) return undefined
  return `${country.dial}${digits}`
}
