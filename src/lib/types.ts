export type CartLineInput = {
  merchandiseId: string
  quantity?: number
}

export type CartLineUpdateInput = {
  id: string
  merchandiseId?: string
  quantity?: number
}

export type CartBuyerIdentityInput = {
  customerAccessToken?: string
  email?: string
  phone?: string
  countryCode?: string
  deliveryAddressPreferences?: [
    {
      address1?: string
      address2?: string
      city?: string
      company?: string
      country?: string
      firstName?: string
      lastName?: string
      phone?: string
      province?: string
      zip?: string
    }
  ]
}

export type DeliveryAddress = {
  address1: string
  address2?: string
  city: string
  company?: string
  country: string
  firstName?: string
  lastName?: string
  phone?: string
  province?: string
  zip: string
}

export type DeliveryOption = {
  handle: string
  title: string
  estimatedCost: {
    amount: string
    currencyCode: string
  }
}
