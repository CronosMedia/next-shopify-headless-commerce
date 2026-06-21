import type {
  InvoiceData,
  InvoiceResponse,
  SmartBillConfig,
  StornoData,
  InvoiceEmailData,
} from '../invoicing-types'

/**
 * SmartBill API Integration
 * Docs: https://api.smartbill.ro/
 */

const SMARTBILL_API_URL = 'https://ws.smartbill.ro/SBORO/api'

export class SmartBillService {
  private config: SmartBillConfig

  constructor(config: SmartBillConfig) {
    this.config = config
  }

  /**
   * Get authorization header for SmartBill API
   */
  private getAuthHeader(): string {
    const credentials = `${this.config.email}:${this.config.apiToken}`
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  /**
   * Transform generic invoice data to SmartBill format
   */
  private transformToSmartBillFormat(data: InvoiceData) {
    return {
      companyVatCode: this.config.companyVatCode,
      client: {
        name: data.client.denumire,
        vatCode: data.client.cui,
        regCom: data.client.nrRegCom || '',
        address: data.client.adresa,
        county: data.client.judet || '',
        city: data.client.localitate || '',
        country: data.client.tara || 'România',
        email: data.client.email || '',
        phone: data.client.telefon || '',
        isTaxPayer: data.client.platitorTva,
        bank: data.client.banca || '',
        iban: data.client.iban || '',
      },
      issueDate: data.date,
      dueDate: data.dueDate || data.date,
      deliveryDate: data.date,
      seriesName: data.series || this.config.defaultSeries || 'VF',
      number: data.number,
      currency: data.currency,
      products: data.items.map(item => ({
        name: item.name,
        code: item.code || '',
        isService: false,
        measuringUnit: item.um,
        quantity: item.quantity,
        price: item.price,
        isTaxIncluded: false,
        taxPercentage: item.vatRate,
        taxName: `TVA ${item.vatRate}%`,
        discount: item.discount || 0,
        discountValue: item.discountValue,
      })),
      observations: data.observations || '',
      mentions: data.mentions || '',
      paymentType: this.mapPaymentMethod(data.paymentMethod),
      isDraft: false,
      precision: 2,
      textTax: data.client.platitorTva ? '' : 'Nesupus TVA, art. 252 pct 2 Cod fiscal',
      issuerName: '', // Nume emitent (opțional)
      deliveryNotes: data.internalNote || '',

      // RO e-Factura
      useEstimateDetails: false,
      ...( data.uploadToAnaf && {
        sendOptions: {
          sendEmail: this.config.sendEmail || false,
          sendEmailToClient: true,
        },
      }),
    }
  }

  /**
   * Map generic payment method to SmartBill format
   */
  private mapPaymentMethod(method?: string): string {
    const mapping: Record<string, string> = {
      cash: 'Numerar',
      card: 'Card',
      stripe: 'Card',
      transfer: 'OP',
      'pos-courier': 'POS curier',
    }
    return mapping[method?.toLowerCase() || 'cash'] || 'Numerar'
  }

  /**
   * Issue a new invoice
   */
  async issueInvoice(data: InvoiceData): Promise<InvoiceResponse> {
    try {
      const smartbillData = this.transformToSmartBillFormat(data)

      const response = await fetch(`${SMARTBILL_API_URL}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(smartbillData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errorText || 'SmartBill API error')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'smartbill',
        invoiceId: result.number, // SmartBill returnează numărul facturii
        series: data.series || this.config.defaultSeries || 'VF',
        number: result.number,
        url: result.url,
        downloadUrl: result.url,
        issuedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'smartbill',
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
   * Get invoice PDF
   */
  async getInvoicePDF(series: string, number: string): Promise<Blob> {
    const response = await fetch(
      `${SMARTBILL_API_URL}/invoice/pdf?cif=${this.config.companyVatCode}&seriesname=${series}&number=${number}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
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
    series: string,
    number: string,
    emailData: InvoiceEmailData
  ): Promise<boolean> {
    try {
      const response = await fetch(`${SMARTBILL_API_URL}/invoice/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          companyVatCode: this.config.companyVatCode,
          seriesName: series,
          number: number,
          to: emailData.to,
          cc: emailData.cc?.join(',') || '',
          subject: emailData.subject || `Factura ${series}${number}`,
          bodyText: emailData.body || '',
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
      const response = await fetch(`${SMARTBILL_API_URL}/invoice/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          companyVatCode: this.config.companyVatCode,
          seriesName: stornoData.originalSeries,
          number: stornoData.originalNumber,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invoice')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'smartbill',
        invoiceId: result.number || '',
        series: stornoData.originalSeries,
        number: stornoData.originalNumber,
        issuedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'smartbill',
        invoiceId: '',
        series: '',
        number: '',
        issuedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get invoice list (for a period)
   */
  async getInvoices(dateFrom: string, dateTo: string) {
    const response = await fetch(
      `${SMARTBILL_API_URL}/invoice/list?cif=${this.config.companyVatCode}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
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
  async uploadToANAF(series: string, number: string): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${SMARTBILL_API_URL}/invoice/upload-to-anaf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          companyVatCode: this.config.companyVatCode,
          seriesName: series,
          number: number,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload to ANAF')
      }

      const result = await response.json()

      return {
        success: true,
        provider: 'smartbill',
        invoiceId: number,
        series,
        number,
        issuedAt: new Date().toISOString(),
        anafStatus: 'uploaded',
        anafUploadIndex: result.index_incarcare,
        anafDownloadId: result.id_descarcare,
      }
    } catch (error) {
      return {
        success: false,
        provider: 'smartbill',
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
