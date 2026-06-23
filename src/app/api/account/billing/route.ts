import {NextRequest} from 'next/server'
import {cookies} from 'next/headers'
import {shopifyClient} from '@/lib/shopify'
import {shopifyAdminRequest} from '@/lib/shopify/admin.server'
import {serverLogger} from '@/lib/logger.server'
import {normalizeRomanianPhoneForShopify} from '@/lib/phone'

const BILLING_NAMESPACE = 'maison'
const LEGACY_BILLING_NAMESPACE = 'custom'
const BILLING_KEY = 'billing_profiles'
const BILLING_SUMMARY_KEY = 'billing_profiles_summary'
const BILLING_TYPE = 'json'
const BILLING_SUMMARY_TYPE = 'multi_line_text_field'

type StoredBillingAddress = {
  street: string
  city: string
  county: string
  postalCode: string
  country: string
}

type StoredBillingProfile = {
  id: string
  type: 'individual' | 'company'
  alias?: string
  name?: string
  companyName?: string
  cui?: string
  registrationNumber?: string
  vatPayer?: boolean
  efactura?: boolean
  address: StoredBillingAddress
  phone: string
  isDefault: boolean
  createdAt: string
  updatedAt?: string
}

type BillingProfile = {
  id?: string
  alias: string
  type: 'personal' | 'business'
  firstName?: string
  lastName?: string
  companyName?: string
  cui?: string
  regCom?: string
  address: string
  city: string
  province: string
  zip: string
  phone: string
  isVatPayer?: boolean
  isEInvoiceActive?: boolean
  isDefault?: boolean
  createdAt?: string
}

type MetafieldsSetResponse = {
  metafieldsSet: {
    metafields: Array<{id: string; value: string}> | null
    userErrors: Array<{field: string[]; message: string}>
  } | null
}

type BillingMetafieldsResponse = {
  customer: {
    primary: {value: string; type: string} | null
    legacy: {value: string; type: string} | null
  } | null
}

type SavePayload = {
  action?: 'save'
  profile?: unknown
}

type DeletePayload = {
  action?: 'delete'
  profileId?: unknown
  profile?: unknown
}

type BillingReadResult = {
  profiles: StoredBillingProfile[]
}

type BillingWriteResult = {
  userErrors: Array<{field: string[]; message: string}>
  errors: string[]
  profilesCountAfterWrite: number
  readBackCount?: number
}

function getStringField(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

function getBooleanField(source: Record<string, unknown>, key: string): boolean | undefined {
  const value = source[key]
  return typeof value === 'boolean' ? value : undefined
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function makeBillingId() {
  return `billing_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts.slice(0, -1).join(' ') || parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}

function toClientProfile(profile: StoredBillingProfile): BillingProfile {
  if (profile.type === 'company') {
    return {
      id: profile.id,
      alias: profile.alias || profile.companyName || 'Facturare firmă',
      type: 'business',
      companyName: profile.companyName || '',
      cui: profile.cui || '',
      regCom: profile.registrationNumber || '',
      address: profile.address.street,
      city: profile.address.city,
      province: profile.address.county,
      zip: profile.address.postalCode,
      phone: profile.phone,
      isVatPayer: Boolean(profile.vatPayer),
      isEInvoiceActive: Boolean(profile.efactura),
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
    }
  }

  const {firstName, lastName} = splitName(profile.name || '')
  return {
    id: profile.id,
    alias: profile.alias || profile.name || 'Facturare personală',
    type: 'personal',
    firstName,
    lastName,
    address: profile.address.street,
    city: profile.address.city,
    province: profile.address.county,
    zip: profile.address.postalCode,
    phone: profile.phone,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
  }
}

function normalizeStoredProfile(value: unknown): StoredBillingProfile | null {
  const source = getRecord(value)
  if (!source) return null

  const id = getStringField(source, 'id')
  const rawType = getStringField(source, 'type')
  const type =
    rawType === 'company' || rawType === 'business'
      ? 'company'
      : rawType === 'individual' || rawType === 'personal'
        ? 'individual'
        : null
  const addressSource = getRecord(source.address)
  const createdAt = getStringField(source, 'createdAt') || new Date().toISOString()

  if (!id || !type) return null

  const street = addressSource
    ? getStringField(addressSource, 'street')
    : getStringField(source, 'address')
  const city = addressSource
    ? getStringField(addressSource, 'city')
    : getStringField(source, 'city')
  const county = addressSource
    ? getStringField(addressSource, 'county')
    : getStringField(source, 'province')
  const postalCode = addressSource
    ? getStringField(addressSource, 'postalCode')
    : getStringField(source, 'zip')
  const phone = normalizeRomanianPhoneForShopify(getStringField(source, 'phone')) || ''

  if (!street || !city || !county || !postalCode || !phone) return null

  const profile: StoredBillingProfile = {
    id,
    type,
    alias: getStringField(source, 'alias') || undefined,
    address: {
      street,
      city,
      county,
      postalCode,
      country: addressSource ? getStringField(addressSource, 'country') || 'RO' : 'RO',
    },
    phone,
    isDefault: Boolean(source.isDefault),
    createdAt,
  }

  const updatedAt = getStringField(source, 'updatedAt')
  if (updatedAt) profile.updatedAt = updatedAt

  if (type === 'company') {
    profile.companyName = getStringField(source, 'companyName')
    profile.cui = getStringField(source, 'cui')
    profile.registrationNumber =
      getStringField(source, 'registrationNumber') || getStringField(source, 'regCom')
    profile.vatPayer = Boolean(source.vatPayer ?? source.isVatPayer)
    profile.efactura = Boolean(source.efactura ?? source.isEInvoiceActive)
    return profile.companyName && profile.cui ? profile : null
  }

  profile.name =
    getStringField(source, 'name') ||
    [getStringField(source, 'firstName'), getStringField(source, 'lastName')]
      .filter(Boolean)
      .join(' ')

  return profile.name ? profile : null
}

function parseBillingProfiles(value: string | null | undefined): StoredBillingProfile[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(normalizeStoredProfile)
      .filter((profile): profile is StoredBillingProfile => Boolean(profile))
  } catch (error) {
    serverLogger.warn('billing.metafield.invalid_json', error)
    return []
  }
}

function normalizeIncomingProfile(input: unknown, existing?: StoredBillingProfile): StoredBillingProfile | null {
  const source = getRecord(input)
  if (!source) return null

  const now = new Date().toISOString()
  const id = getStringField(source, 'id') || existing?.id || makeBillingId()
  const rawType = getStringField(source, 'type')
  const type =
    rawType === 'company' || rawType === 'business'
      ? 'company'
      : rawType === 'individual' || rawType === 'personal'
        ? 'individual'
        : null

  if (!type) return null

  const phone = normalizeRomanianPhoneForShopify(getStringField(source, 'phone'))
  const addressSource = getRecord(source.address)
  const street = addressSource
    ? getStringField(addressSource, 'street')
    : getStringField(source, 'address')
  const city = addressSource
    ? getStringField(addressSource, 'city')
    : getStringField(source, 'city')
  const county = addressSource
    ? getStringField(addressSource, 'county')
    : getStringField(source, 'province')
  const postalCode = addressSource
    ? getStringField(addressSource, 'postalCode')
    : getStringField(source, 'zip')

  if (!phone || !street || !city || !county || !postalCode) return null

  const profile: StoredBillingProfile = {
    id,
    type,
    alias: getStringField(source, 'alias') || existing?.alias || undefined,
    address: {
      street,
      city,
      county,
      postalCode,
      country: addressSource ? getStringField(addressSource, 'country') || 'RO' : 'RO',
    },
    phone,
    isDefault: getBooleanField(source, 'isDefault') ?? existing?.isDefault ?? false,
    createdAt: existing?.createdAt || getStringField(source, 'createdAt') || now,
    updatedAt: existing ? now : undefined,
  }

  if (type === 'company') {
    profile.companyName = getStringField(source, 'companyName')
    profile.cui = getStringField(source, 'cui')
    profile.registrationNumber =
      getStringField(source, 'registrationNumber') || getStringField(source, 'regCom')
    profile.vatPayer = Boolean(source.vatPayer ?? source.isVatPayer)
    profile.efactura = Boolean(source.efactura ?? source.isEInvoiceActive)
    return profile.companyName && profile.cui ? profile : null
  }

  profile.name =
    getStringField(source, 'name') ||
    [getStringField(source, 'firstName'), getStringField(source, 'lastName')]
      .filter(Boolean)
      .join(' ')

  return profile.name ? profile : null
}

function normalizeDefaultProfiles(profiles: StoredBillingProfile[]) {
  if (profiles.length === 0) return []

  const requestedDefaultIndex = profiles.findIndex((profile) => profile.isDefault)
  const defaultIndex = requestedDefaultIndex >= 0 ? requestedDefaultIndex : 0

  return profiles.map((profile, index) => ({
    ...profile,
    isDefault: index === defaultIndex,
  }))
}

function formatProfileSummary(profile: StoredBillingProfile) {
  const defaultLabel = profile.isDefault ? 'Default' : profile.alias || 'Profil'
  const address = [
    profile.address.street,
    profile.address.city,
    profile.address.county,
    profile.address.postalCode,
  ].filter(Boolean).join(', ')

  if (profile.type === 'company') {
    return [
      `${defaultLabel}: ${profile.companyName || 'Firmă'}`,
      profile.cui ? `CUI ${profile.cui}` : '',
      profile.registrationNumber ? `Reg. Com. ${profile.registrationNumber}` : '',
      profile.vatPayer ? 'TVA: Da' : 'TVA: Nu',
      profile.efactura ? 'e-Factura: Da' : 'e-Factura: Nu',
      address,
      profile.phone,
    ].filter(Boolean).join(' | ')
  }

  return [
    `${defaultLabel}: ${profile.name || 'Persoană fizică'}`,
    address,
    profile.phone,
  ].filter(Boolean).join(' | ')
}

function formatProfilesSummary(profiles: StoredBillingProfile[]) {
  if (profiles.length === 0) return 'Nu există profile de facturare salvate.'

  return profiles.map(formatProfileSummary).join('\n')
}

async function getCustomerId(customerAccessToken: string): Promise<string | null> {
  const query = `#graphql
    query GetCustomerId($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
      }
    }
  `

  try {
    const response = await shopifyClient.request<{customer: {id: string} | null}>(query, {
      customerAccessToken,
    })
    return response.data?.customer?.id || null
  } catch (error) {
    serverLogger.warn('billing.customer_lookup.failed', error)
    return null
  }
}

async function getAuthenticatedCustomerId() {
  const cookieStore = await cookies()
  const customerAccessToken = cookieStore.get('customer-access-token')?.value
  if (!customerAccessToken) return null

  return getCustomerId(customerAccessToken)
}

async function readPrimaryProfiles(customerId: string) {
  const query = `#graphql
    query GetCustomerBillingMetafield($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "${BILLING_NAMESPACE}", key: "${BILLING_KEY}") {
          value
          type
        }
      }
    }
  `
  const adminResponse = await shopifyAdminRequest<{
    customer: {metafield: {value: string; type: string} | null} | null
  }>(query, {id: customerId})

  if (adminResponse.errors?.length) {
    throw new Error(adminResponse.errors[0].message)
  }

  return parseBillingProfiles(adminResponse.data?.customer?.metafield?.value)
}

async function readProfiles(customerId: string, options: {migrateLegacy?: boolean} = {}): Promise<BillingReadResult> {
  const query = `#graphql
    query GetCustomerBillingMetafields($id: ID!) {
      customer(id: $id) {
        primary: metafield(namespace: "${BILLING_NAMESPACE}", key: "${BILLING_KEY}") {
          value
          type
        }
        legacy: metafield(namespace: "${LEGACY_BILLING_NAMESPACE}", key: "${BILLING_KEY}") {
          value
          type
        }
      }
    }
  `
  const adminResponse = await shopifyAdminRequest<BillingMetafieldsResponse>(query, {id: customerId})

  if (adminResponse.errors?.length) {
    throw new Error(adminResponse.errors[0].message)
  }

  const primaryProfiles = parseBillingProfiles(adminResponse.data?.customer?.primary?.value)
  if (primaryProfiles.length > 0) {
    return {profiles: primaryProfiles}
  }

  const legacyProfiles = parseBillingProfiles(adminResponse.data?.customer?.legacy?.value)
  if (legacyProfiles.length === 0) {
    return {profiles: []}
  }

  const normalizedLegacyProfiles = normalizeDefaultProfiles(legacyProfiles)
  if (options.migrateLegacy) {
    const writeResult = await writeProfiles(customerId, normalizedLegacyProfiles)
    const migrationSucceeded =
      writeResult.errors.length === 0 &&
      writeResult.userErrors.length === 0 &&
      (writeResult.readBackCount ?? 0) > 0

    if (!migrationSucceeded) {
      serverLogger.warn('billing.legacy_migration.failed')
    }
  }

  return {profiles: normalizedLegacyProfiles}
}

async function writeProfiles(customerId: string, profiles: StoredBillingProfile[]): Promise<BillingWriteResult> {
  const mutation = `#graphql
    mutation SetCustomerBillingMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await shopifyAdminRequest<MetafieldsSetResponse>(mutation, {
      metafields: [
        {
          ownerId: customerId,
          namespace: BILLING_NAMESPACE,
          key: BILLING_KEY,
          value: JSON.stringify(profiles),
          type: BILLING_TYPE,
        },
        {
          ownerId: customerId,
          namespace: BILLING_NAMESPACE,
          key: BILLING_SUMMARY_KEY,
          value: formatProfilesSummary(profiles),
          type: BILLING_SUMMARY_TYPE,
        },
      ],
    })

    const errors = response.errors?.map((error) => error.message) || []
    const userErrors = response.data?.metafieldsSet?.userErrors || []
    const readBackProfiles = await readPrimaryProfiles(customerId)

    return {
      userErrors,
      errors,
      profilesCountAfterWrite: profiles.length,
      readBackCount: readBackProfiles.length,
    }
  } catch (error) {
    return {
      userErrors: [],
      errors: [error instanceof Error ? error.message : 'Unknown Shopify Admin API error'],
      profilesCountAfterWrite: profiles.length,
    }
  }
}

function writeFailed(writeResult: BillingWriteResult) {
  const readBackMismatch =
    typeof writeResult.readBackCount === 'number' &&
    writeResult.readBackCount !== writeResult.profilesCountAfterWrite

  return writeResult.errors.length > 0 || writeResult.userErrors.length > 0 || readBackMismatch
}

export async function GET() {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const readResult = await readProfiles(customerId, {migrateLegacy: true})
    return Response.json({billingProfiles: readResult.profiles.map(toClientProfile)})
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to fetch billing profiles'}},
      {status: 500}
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const payload = (await req.json()) as SavePayload | DeletePayload
    if (payload.action === 'delete') {
      return deleteProfile(customerId, payload)
    }

    return saveProfile(customerId, payload)
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to update billing profiles'}},
      {status: 500}
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const payload = (await req.json()) as SavePayload
    return saveProfile(customerId, payload)
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to update billing profiles'}},
      {status: 500}
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return Response.json({error: {message: 'Not authenticated'}}, {status: 401})
    }

    const {searchParams} = new URL(req.url)
    return deleteProfile(customerId, {
      action: 'delete',
      profileId: searchParams.get('profileId') || searchParams.get('id'),
    })
  } catch (error: unknown) {
    return Response.json(
      {error: {message: error instanceof Error ? error.message : 'Failed to delete billing profile'}},
      {status: 500}
    )
  }
}

async function saveProfile(customerId: string, payload: SavePayload | DeletePayload) {
  if (payload.action && payload.action !== 'save') {
    return Response.json({error: {message: 'Invalid action'}}, {status: 400})
  }

  const existingReadResult = await readProfiles(customerId)
  const existingProfiles = existingReadResult.profiles
  const source = getRecord(payload.profile)
  const profileId = source ? getStringField(source, 'id') : ''
  const existingProfile = profileId
    ? existingProfiles.find((profile) => profile.id === profileId)
    : undefined
  const normalizedProfile = normalizeIncomingProfile(payload.profile, existingProfile)

  if (!normalizedProfile) {
    return Response.json(
      {error: {message: 'Datele de facturare sunt invalide.'}},
      {status: 400}
    )
  }

  let savedProfile = normalizedProfile
  const profiles = existingProfile
    ? existingProfiles.map((profile) => (profile.id === savedProfile.id ? savedProfile : profile))
    : [...existingProfiles, savedProfile]
  const nextProfiles = normalizeDefaultProfiles(
    savedProfile.isDefault
      ? profiles.map((profile) => ({...profile, isDefault: profile.id === savedProfile.id}))
      : profiles
  )

  savedProfile = nextProfiles.find((profile) => profile.id === savedProfile.id) || savedProfile
  const writeResult = await writeProfiles(customerId, nextProfiles)

  if (writeFailed(writeResult)) {
    const message =
      writeResult.userErrors[0]?.message ||
      writeResult.errors[0] ||
      'Failed to save billing profiles'
    return Response.json(
      {error: {message}},
      {status: 400}
    )
  }

  return Response.json({
    billingProfile: toClientProfile(savedProfile),
    billingProfiles: nextProfiles.map(toClientProfile),
  })
}

async function deleteProfile(customerId: string, payload: DeletePayload) {
  const profileSource = getRecord(payload.profile)
  const profileId =
    typeof payload.profileId === 'string'
      ? payload.profileId
      : profileSource
        ? getStringField(profileSource, 'id')
        : ''

  if (!profileId) {
    return Response.json(
      {error: {message: 'Profile ID required for deletion'}},
      {status: 400}
    )
  }

  const existingReadResult = await readProfiles(customerId)
  const nextProfiles = normalizeDefaultProfiles(
    existingReadResult.profiles.filter((profile) => profile.id !== profileId)
  )

  const writeResult = await writeProfiles(customerId, nextProfiles)

  if (writeFailed(writeResult)) {
    const message =
      writeResult.userErrors[0]?.message ||
      writeResult.errors[0] ||
      'Failed to delete billing profile'
    return Response.json(
      {error: {message}},
      {status: 400}
    )
  }

  return Response.json({billingProfiles: nextProfiles.map(toClientProfile)})
}
