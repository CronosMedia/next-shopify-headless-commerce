// Romanian Invoicing Types & Interfaces

export type InvoiceProvider = 'smartbill' | 'oblio' | 'fgo' | 'demo'
export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled' | 'storno'
export type InvoiceType = 'invoice' | 'proforma' | 'receipt' | 'credit_note'

// Client/Company Data (unified across providers)
export interface CompanyData {
  cui: string // CUI/CIF (fără RO prefix)
  denumire: string // Denumire firmă
  nrRegCom?: string // Nr. Reg. Com (J40/123/2020)
  adresa: string // Adresă completă
  judet?: string // Județ
  localitate?: string // Oraș/Localitate
  codPostal?: string // Cod poștal
  tara?: string // Țară (default: România)

  // Contact
  telefon?: string
  email?: string

  // Tax info
  platitorTva: boolean // Plătitor TVA
  platitorTvaData?: string // Data de la care e plătitor TVA (YYYY-MM-DD)
  platitorTvaLaIncasare?: boolean // TVA la încasare

  // Banking
  banca?: string
  iban?: string

  // RO e-Factura specific
  statusRO_e_Factura?: boolean // Înregistrat în SPV
  codEFactura?: string // Cod ANAF pentru e-Factura
}

// ANAF API Response (v9)
export interface ANAFResponse {
  cui: number
  data: string // Data solicitării
  denumire: string
  adresa: string
  nrRegCom: string
  telefon: string
  codPostal: string
  act: string
  stare_inregistrare: string
  data_inregistrare: string
  cod_CAEN: string
  iban: string
  statusRO_e_Factura: boolean
  organFiscalCompetent: string
  forma_de_proprietate: string
  forma_organizare: string
  forma_juridica: string

  // TVA
  scpTVA: boolean // Plătitor TVA (Split TVA Payment)
  dataInceputTvaInc?: string
  dataSfarsitTvaInc?: string
  dataActualizareTvaInc?: string
  dataPublicareTvaInc?: string
  tipActTvaInc?: string
  statusTvaIncasare?: boolean
  dataInactivare?: string
  dataReactivare?: string
  dataPublicare?: string
  dataSfarsit?: string
  dataInceput?: string
}

// Invoice Line Item
export interface InvoiceLineItem {
  name: string // Denumire produs/serviciu
  code?: string // Cod produs (SKU)
  description?: string // Descriere
  um: string // Unitate de măsură (buc, kg, etc.)
  quantity: number // Cantitate
  price: number // Preț unitar (fără TVA)
  priceWithVat?: number // Preț unitar cu TVA
  vatRate: number // Cotă TVA (19, 9, 5, 0)
  vatValue?: number // Valoare TVA
  total: number // Total (fără TVA)
  totalWithVat?: number // Total cu TVA

  // Optional fields
  discount?: number // Reducere (%)
  discountValue?: number // Valoare reducere
}

// Invoice Data (generic, works with all providers)
export interface InvoiceData {
  // Metadata
  series?: string // Serie factură (ex: VF)
  number?: string // Număr factură (auto-generate dacă lipsește)
  date: string // Data emiterii (YYYY-MM-DD)
  dueDate?: string // Data scadentă (YYYY-MM-DD)

  // Type
  type: InvoiceType
  currency: string // RON, EUR, USD

  // Client
  client: CompanyData

  // Items
  items: InvoiceLineItem[]

  // Totals
  subtotal: number // Total fără TVA
  totalVat: number // Total TVA
  total: number // Total cu TVA

  // Discounts & Fees
  globalDiscount?: number // Reducere globală (%)
  globalDiscountValue?: number // Valoare reducere globală
  shipping?: number // Cost transport
  deliveryFee?: number // Taxă livrare

  // Payment
  paymentMethod?: string // Card, Cash, Transfer
  isPaid?: boolean
  paidDate?: string // Data plății (YYYY-MM-DD)

  // Notes
  observations?: string // Observații (publice, apar pe factură)
  mentions?: string // Mențiuni (publice)
  internalNote?: string // Notă internă (nu apare pe factură)

  // Related documents
  orderId?: string // ID comandă (referință internă)
  proformaNumber?: string // Nr. proforma (dacă factura e după proforma)

  // RO e-Factura specific
  uploadToAnaf?: boolean // Încarcă în SPV
  anafCif?: string // CIF destinatar (pentru validare ANAF)
}

// Invoice Response (from provider)
export interface InvoiceResponse {
  success: boolean
  provider: InvoiceProvider

  // Invoice data
  invoiceId: string // ID factură în sistem provider
  series: string
  number: string
  url?: string // URL factură PDF
  downloadUrl?: string // Direct download link

  // Timestamps
  issuedAt: string // ISO date string

  // ANAF specific
  anafStatus?: 'pending' | 'uploaded' | 'validated' | 'rejected' | 'error'
  anafUploadIndex?: string // Index ANAF (pentru tracking)
  anafDownloadId?: string // Download ID ANAF
  anafValidationMessages?: string[]

  // Error handling
  error?: string
  errorDetails?: unknown
}

// Provider Configuration
export interface ProviderConfig {
  provider: InvoiceProvider
  isActive: boolean

  // API Credentials
  apiToken?: string // SmartBill, Oblio
  email?: string // SmartBill
  apiKey?: string // FGO
  companyVatNumber?: string // FGO

  // Settings
  defaultSeries?: string // Serie default
  defaultLanguage?: 'ro' | 'en'
  sendEmail?: boolean // Trimite automat pe email

  // RO e-Factura
  anafEnabled?: boolean
  anafCertPath?: string // Path către certificat e-Factura
  anafCertPassword?: string
}

// Provider-specific configurations

export interface SmartBillConfig extends ProviderConfig {
  provider: 'smartbill'
  email: string // SmartBill account email
  apiToken: string // SmartBill API token
  companyVatCode: string // CUI firmă (fără RO)
  usePublicCloud?: boolean // Cloud public sau server propriu
  baseUrl?: string // Custom base URL (pentru server propriu)
}

export interface OblioConfig extends ProviderConfig {
  provider: 'oblio'
  email: string // Oblio account email
  secret: string // Oblio secret key
  cif: string // CUI firmă (cu sau fără RO)
  baseUrl?: string // API base URL
}

export interface FGOConfig extends ProviderConfig {
  provider: 'fgo'
  companyVatNumber: string // CUI firmă (RO + cifre)
  apiKey: string // FGO API key
  managementApiKey?: string // FGO Management API key
  environment?: 'production' | 'sandbox'
}

// Invoice History Entry
export interface InvoiceHistoryEntry {
  id: string
  orderId: string
  invoiceId: string // ID în sistemul provider
  provider: InvoiceProvider
  type: InvoiceType
  series: string
  number: string
  total: number
  status: InvoiceStatus
  issuedAt: string
  sentAt?: string
  paidAt?: string
  client: {
    cui: string
    denumire: string
  }
  pdfUrl?: string
  anafStatus?: string
  createdAt: string
  updatedAt: string
}

// Storno (Credit Note) Data
export interface StornoData {
  originalInvoiceId: string // ID factura originală
  originalSeries: string
  originalNumber: string
  reason: string // Motiv stornare
  partialStorno?: boolean // Storno parțial
  itemsToStorno?: string[] // IDs items de stornat (pentru partial)
  newInvoiceData?: Partial<InvoiceData> // Datele noii facturi (după storno)
}

// Invoice Email Data
export interface InvoiceEmailData {
  to: string // Email destinatar
  cc?: string[] // CC emails
  subject?: string // Subiect email (auto-generate dacă lipsește)
  body?: string // Corp email (template)
  attachPdf?: boolean // Atașează PDF
  attachXml?: boolean // Atașează XML (pentru e-Factura)
}

// Invoice Validation Errors
export interface InvoiceValidationError {
  field: string
  message: string
  code?: string
}

// Invoice Statistics
export interface InvoiceStats {
  totalIssued: number // Total facturi emise
  totalValue: number // Valoare totală
  totalPaid: number // Total plătit
  totalUnpaid: number // Total neplătit
  totalOverdue: number // Total restanțe
  byProvider: Record<InvoiceProvider, number> // Per provider
  byMonth: Record<string, number> // Per lună (YYYY-MM)
  byStatus: Record<InvoiceStatus, number> // Per status
}
