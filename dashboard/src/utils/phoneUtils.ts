/**
 * Phone number normalization & formatting utilities for Bizzap.
 *
 * Rules:
 * - Mobile (10 digits starting with 6, 7, 8, 9):
 *     Store: "9894066044" (no leading 0, no +91)
 *     Dial (tel:): "9894066044"
 *     WhatsApp (wa.me): "919894066044"
 * - Landline:
 *     Adds STD code dynamically according to city/address (e.g. 0421 for Tiruppur, 0422 for Coimbatore, 044 for Chennai).
 *     Defaults to 0421 (Tiruppur) if no city match found.
 */

export const CITY_STD_CODES: Record<string, string> = {
  tiruppur: '0421',
  tirupur: '0421',
  coimbatore: '0422',
  kovai: '0422',
  erode: '0424',
  salem: '0427',
  chennai: '044',
  madurai: '0452',
  trichy: '0431',
  tiruchirappalli: '0431',
  karur: '04324',
  namakkal: '04286',
  dindigul: '0451',
  thanjavur: '04362',
  vellore: '0416',
  tuticorin: '0461',
  thoothukudi: '0461',
  tirunelveli: '0462',
  bengaluru: '080',
  bangalore: '080',
  mumbai: '022',
  delhi: '011',
  hyderabad: '040',
}

export function getStdCode(cityOrAddress?: string | null): string {
  if (cityOrAddress) {
    const text = cityOrAddress.toLowerCase()
    for (const [city, code] of Object.entries(CITY_STD_CODES)) {
      if (text.includes(city)) {
        return code
      }
    }
  }
  return '0421' // Default Tiruppur
}

export function normalizePhone(
  phone: string | null | undefined,
  cityOrAddress?: string | null
): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  // Indian Mobile: 10 digits starting with 6, 7, 8, 9
  if (digits.length === 12 && digits.startsWith('91') && ['6', '7', '8', '9'].includes(digits[2])) {
    return digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith('0') && ['6', '7', '8', '9'].includes(digits[1])) {
    return digits.slice(1)
  }
  if (digits.length === 10 && ['6', '7', '8', '9'].includes(digits[0])) {
    return digits
  }

  // Landline with dynamic city STD code
  const stdCode = getStdCode(cityOrAddress)
  if (digits.length === 7 || digits.length === 8) {
    return `${stdCode}${digits}`
  }
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 11 || digits.length === 12)) {
    return digits
  }
  if (digits.startsWith('91') && (digits.length === 12 || digits.length === 13)) {
    return `0${digits.slice(2)}`
  }

  return digits
}

export function cleanPhoneForDial(
  phone: string | null | undefined,
  cityOrAddress?: string | null
): string {
  const norm = normalizePhone(phone, cityOrAddress)
  return norm || ''
}

export function cleanPhoneForWa(
  phone: string | null | undefined,
  cityOrAddress?: string | null
): string {
  const norm = normalizePhone(phone, cityOrAddress)
  if (!norm) return ''
  if (norm.length < 7) return norm
  if (norm.length === 10 && ['6', '7', '8', '9'].includes(norm[0])) {
    return `91${norm}`
  }
  if (norm.startsWith('0')) {
    return `91${norm.slice(1)}`
  }
  return `91${norm}`
}
