declare module 'country-telephone-data' {
  interface CountryEntry {
    name: string
    iso2: string
    dialCode: string
    format?: string
    priority?: number
    hasAreaCodes?: boolean
  }

  interface CountryTelephoneData {
    allCountries: CountryEntry[]
    iso2Lookup: Record<string, number>
    allCountryCodes: Record<string, string[]>
  }

  const countryTelephoneData: CountryTelephoneData
  export default countryTelephoneData
}
