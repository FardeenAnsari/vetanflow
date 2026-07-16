export type CountryOption = {
  code: string
  currencyCode: string
  label: string
  locale: string
  timezones: string[]
}

export const countryOptions: CountryOption[] = [
  { code: 'AU', currencyCode: 'AUD', label: 'Australia', locale: 'en-AU', timezones: ['Australia/Sydney', 'Australia/Perth'] },
  { code: 'CA', currencyCode: 'CAD', label: 'Canada', locale: 'en-CA', timezones: ['America/Toronto', 'America/Vancouver'] },
  { code: 'FR', currencyCode: 'EUR', label: 'France', locale: 'fr-FR', timezones: ['Europe/Paris'] },
  { code: 'DE', currencyCode: 'EUR', label: 'Germany', locale: 'de-DE', timezones: ['Europe/Berlin'] },
  { code: 'IN', currencyCode: 'INR', label: 'India', locale: 'en-IN', timezones: ['Asia/Kolkata'] },
  { code: 'JP', currencyCode: 'JPY', label: 'Japan', locale: 'ja-JP', timezones: ['Asia/Tokyo'] },
  { code: 'NL', currencyCode: 'EUR', label: 'Netherlands', locale: 'nl-NL', timezones: ['Europe/Amsterdam'] },
  { code: 'SG', currencyCode: 'SGD', label: 'Singapore', locale: 'en-SG', timezones: ['Asia/Singapore'] },
  { code: 'ZA', currencyCode: 'ZAR', label: 'South Africa', locale: 'en-ZA', timezones: ['Africa/Johannesburg'] },
  { code: 'AE', currencyCode: 'AED', label: 'United Arab Emirates', locale: 'en-AE', timezones: ['Asia/Dubai'] },
  { code: 'GB', currencyCode: 'GBP', label: 'United Kingdom', locale: 'en-GB', timezones: ['Europe/London'] },
  { code: 'US', currencyCode: 'USD', label: 'United States', locale: 'en-US', timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'] },
]

export const currencyOptions = [
  { code: 'AED', label: 'UAE dirham' },
  { code: 'AUD', label: 'Australian dollar' },
  { code: 'CAD', label: 'Canadian dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'Pound sterling' },
  { code: 'INR', label: 'Indian rupee' },
  { code: 'JPY', label: 'Japanese yen' },
  { code: 'SGD', label: 'Singapore dollar' },
  { code: 'USD', label: 'US dollar' },
  { code: 'ZAR', label: 'South African rand' },
]

export const localeOptions = [
  { code: 'de-DE', label: 'Deutsch (Deutschland)' },
  { code: 'en-AE', label: 'English (United Arab Emirates)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'en-CA', label: 'English (Canada)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-SG', label: 'English (Singapore)' },
  { code: 'en-US', label: 'English (United States)' },
  { code: 'en-ZA', label: 'English (South Africa)' },
  { code: 'fr-FR', label: 'Francais (France)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'nl-NL', label: 'Nederlands (Nederland)' },
]

export const timezoneOptions = Array.from(
  new Set(countryOptions.flatMap((country) => country.timezones)),
).sort((left, right) => left.localeCompare(right))

export function getCountryOption(countryCode: string) {
  return countryOptions.find((country) => country.code === countryCode)
}
