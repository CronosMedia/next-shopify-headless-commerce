export type AdminOrder = {
  id: string
  name: string
  createdAt: string
  financialStatus: string
  fulfillmentStatus: string
  total: {
    amount: string
    currency: string
  }
  customAttributes: Array<{
    key: string
    value: string
  }>
  customer: {
    name: string
    email: string
  }
  invoice: {
    url: string
    number: string
    series: string
    provider: string
    status: 'issued' | 'simulated' | 'error'
  } | null
  awb: {
    code: string
    courier: string
    provider: string
    status: 'issued' | 'simulated' | 'error'
    trackingUrl: string
  } | null
}

export type AdminOrdersResponse = {
  orders?: AdminOrder[]
  error?: string
}
