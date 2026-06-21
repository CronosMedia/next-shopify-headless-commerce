import type {
  InvoiceData,
  InvoiceResponse,
  OblioConfig,
  StornoData,
  InvoiceEmailData,
} from '../invoicing-types'

/**
 * Oblio API Integration
 * Docs: https://www.oblio.eu/api/docs
 */

const OBLIO_API_URL = 'https://www.oblio.eu/api'

export class OblioService {
  private config: OblioConfig
  private accessToken?: string
  private tokenExpiry?: number

  constructor(config: OblioConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || OBLIO_API_URL,
    }
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch(`${this.config.baseUrl}/authorize/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.email,
        client_secret: this.config.secret,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      throw new Error('Oblio authentication failed')
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Subtract 1 min for safety

    if (!this.accessToken) {
      throw new Error('Oblio authentication failed: no access token received')
    }

    return this.accessToken
  }

  /**
   * Transform generic invoice data to Oblio format
   */
  private transformToOblioFormat(data: InvoiceData) {
    return {
      cif: this.config.cif,
      client: {
        cif: data.client.cui,
        name: data.client.denumire,
        rc: data.client.nrRegCom || '',
        address: data.client.adresa,
        state: data.client.judet || '',
        city: data.client.localitate || '',
        country: data.client.tara || 'Romania',
        iban: data.client.iban || '',
        bank: data.client.banca || '',
        email: data.client.email || '',
        phone: data.client.telefon || '',
        contact: '',
        vatPayer: data.client.platitorTva,
      },
      issueDate: data.date,
      dueDate: data.dueDate || data.date,
      deliveryDate: data.date,
      collectDate: data.isPaid ? data.paidDate : undefined,
      seriesName: data.series || this.config.defaultSeries || 'VF',
      number: data.number,
      currency: data.currency,
      precision: 2,
      language: this.config.defaultLanguage || 'ro',
      products: data.items.map(item => ({
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        price: item.price,
        measuringUnit: item.um,
        currency: data.currency,
        vatName: `TVA ${item.vatRate}%`,
        vatPercentage: item.vatRate,
        vatIncluded: false,
        quantity: item.quantity,
        productType: 'Produs', // 'Produs' sau 'Serviciu'
      })),
      issuerName: '',
      issuerId: '',
      noticeNumber: '',
      internalNote: data.internalNote || '',
      deputyName: '',
      deputyIdentityCard: '',
      deputyAuto: '',
      salesDelegates: '',
      collect: data.isPaid ? [
        {
          type: this.mapPaymentMethod(data.paymentMethod),
          value: data.total,
        },
      ] : undefined,
      referenceDocument: data.proformaNumber ? {
        type: 'Proforma',
        number: data.proformaNumber,
      } : undefined,
      mentions: data.mentions || '',
      useStock: 0,
    }
  }

  /**
   * Map generic payment method to Oblio format
   */
  private mapPaymentMethod(method?: string): string {
    const mapping: Record<string, string> = {
      cash: 'Numerar',
      card: 'Card',
      stripe: 'Card',
      transfer: 'OP',
      'pos-courier': 'Card',
    }
    return mapping[method?.toLowerCase() || 'cash'] || 'Numerar'
  }

  /**
   * Issue a new invoice
   */
  async issueInvoice(data: InvoiceData): Promise<InvoiceResponse> {
    try {
      const token = await this.authenticate()
      const oblioData = this.transformToOblioFormat(data)

      const documentType = this.mapInvoiceType(data.type)

      const response = await fetch(`${this.config.baseUrl}/docs/${documentType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(oblioData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.statusMessage || 'Oblio API error')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'oblio',
        invoiceId: result.data.id,
        series: result.data.seriesName,
        number: result.data.number,
        url: result.data.link,
        downloadUrl: result.data.link,
        issuedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'oblio',
        invoiceId: '',
        series: '',
        number: '',
        issuedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error,
      }
    }
  }

  /**
   * Map generic invoice type to Oblio document type
   */
  private mapInvoiceType(type: string): string {
    const mapping: Record<string, string> = {
      invoice: 'invoice',
      proforma: 'proforma',
      receipt: 'receipt',
      credit_note: 'notice',
    }
    return mapping[type] || 'invoice'
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePDF(invoiceId: string): Promise<Blob> {
    const token = await this.authenticate()

    const response = await fetch(
      `${this.config.baseUrl}/docs/invoice/${invoiceId}?format=pdf`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch PDF')
    }

    return await response.blob()
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(
    invoiceId: string,
    emailData: InvoiceEmailData
  ): Promise<boolean> {
    try {
      const token = await this.authenticate()

      const response = await fetch(`${this.config.baseUrl}/docs/invoice/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          cc: emailData.cc?.join(','),
          subject: emailData.subject,
          body: emailData.body,
        }),
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Cancel invoice (Storno)
   */
  async cancelInvoice(stornoData: StornoData): Promise<InvoiceResponse> {
    try {
      const token = await this.authenticate()

      const response = await fetch(`${this.config.baseUrl}/docs/invoice/${stornoData.originalInvoiceId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueDate: new Date().toISOString().split('T')[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invoice')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'oblio',
        invoiceId: result.data.id,
        series: result.data.seriesName,
        number: result.data.number,
        issuedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'oblio',
        invoiceId: '',
        series: '',
        number: '',
        issuedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get invoice list
   */
  async getInvoices(dateFrom: string, dateTo: string) {
    const token = await this.authenticate()

    const response = await fetch(
      `${this.config.baseUrl}/docs/invoice?cif=${this.config.cif}&from=${dateFrom}&to=${dateTo}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch invoices')
    }

    return await response.json()
  }

  /**
   * Upload invoice to ANAF (RO e-Factura)
   */
  async uploadToANAF(invoiceId: string): Promise<InvoiceResponse> {
    try {
      const token = await this.authenticate()

      const response = await fetch(`${this.config.baseUrl}/docs/invoice/${invoiceId}/efactura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to upload to ANAF')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'oblio',
        invoiceId: invoiceId,
        series: '',
        number: '',
        issuedAt: new Date().toISOString(),
        anafStatus: result.data.status === 'ok' ? 'uploaded' : 'error',
        anafUploadIndex: result.data.uploadIndex,
      }
    } catch (error) {
      return {
        success: false,
        provider: 'oblio',
        invoiceId: '',
        series: '',
        number: '',
        issuedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        anafStatus: 'error',
      }
    }
  }
}
