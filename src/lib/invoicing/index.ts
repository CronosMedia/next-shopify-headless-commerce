import { OblioService } from './oblio'
import { SmartBillService } from './smartbill'
import type { InvoiceData, InvoiceResponse, OblioConfig, SmartBillConfig } from '../invoicing-types'

// Define a common interface for the invoice issuance
export interface InvoicingService {
  issueInvoice(data: InvoiceData): Promise<InvoiceResponse>
}

// Mock service for Demo Mode
class DemoInvoicingService implements InvoicingService {
  async issueInvoice(data: InvoiceData): Promise<InvoiceResponse> {
    const series = data.series || 'DEMO'
    // Generate a random 4-digit number
    const number = Math.floor(1000 + Math.random() * 9000).toString()
    
    // We return a mock response that links to the Next.js local dynamic invoice print/download page
    const localInvoiceUrl = `/invoice/download/${data.orderId || 'demo'}?series=${series}&number=${number}`

    return {
      success: true,
      provider: 'demo',
      invoiceId: `demo-id-${number}`,
      series,
      number,
      url: localInvoiceUrl,
      downloadUrl: localInvoiceUrl,
      issuedAt: new Date().toISOString(),
    }
  }
}

/**
 * Factory to get the active invoicing service based on environment configurations.
 */
export function getInvoicingService(): InvoicingService {
  const provider = process.env.INVOICING_PROVIDER || 'demo'

  if (provider === 'oblio') {
    const email = process.env.OBLIO_EMAIL
    const secret = process.env.OBLIO_SECRET
    const cif = process.env.OBLIO_CIF
    const defaultSeries = process.env.OBLIO_DEFAULT_SERIES || 'FCT'

    if (email && secret && cif) {
      const config: OblioConfig = {
        provider: 'oblio',
        isActive: true,
        email,
        secret,
        cif,
        defaultSeries,
      }
      return new OblioService(config)
    }
  }

  if (provider === 'smartbill') {
    const email = process.env.SMARTBILL_EMAIL
    const apiToken = process.env.SMARTBILL_TOKEN
    const companyVatCode = process.env.SMARTBILL_CIF
    const defaultSeries = process.env.SMARTBILL_DEFAULT_SERIES || 'FCT'

    if (email && apiToken && companyVatCode) {
      const config: SmartBillConfig = {
        provider: 'smartbill',
        isActive: true,
        email,
        apiToken,
        companyVatCode,
        defaultSeries,
      }
      return new SmartBillService(config)
    }
  }

  // Fallback to Demo mode
  return new DemoInvoicingService()
}
