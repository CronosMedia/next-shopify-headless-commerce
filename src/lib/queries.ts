export const PRODUCTS_QUERY = `#graphql
  query Products($first: Int = 12) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          variants(first: 5) {
            edges {
              node {
                id
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`

export const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      descriptionHtml
      featuredImage { url altText width height }
      images(first: 12) { edges { node { url altText width height } } }
      options { name values }
      collections(first: 1) { edges { node { title handle } } }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText width height }
            selectedOptions { name value }
            product { vendor title }
            metafield(namespace: "custom", key: "color_value") {
              value
            }
          }
        }
      }
    }
  }
`

export const RELATED_PRODUCTS_QUERY = `#graphql
  query RelatedProducts($productId: ID!, $first: Int = 4) {
    product(id: $productId) {
      id
      tags
    }
    products(first: $first, query: "tag:supplements OR tag:vitamins") {
      edges {
        node {
          id
          handle
          title
          featuredImage { url altText width height }
          priceRange { minVariantPrice { amount currencyCode } }
          variants(first: 5) {
            edges {
              node {
                id
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`

export const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `#graphql
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
    }
  }
`

export const GET_CUSTOMER_QUERY = `#graphql
  query GetCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      addresses(first: 10) {
        edges {
          node {
            id
            firstName
            lastName
            name
            company
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
      }
      defaultAddress {
        id
        firstName
        lastName
        name
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
    }
  }
`

export const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customer {
        id
        firstName
        lastName
        email
        phone
      }
    }
  }
`

export const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation customerUpdate($customer: CustomerUpdateInput!, $customerAccessToken: String!) {
    customerUpdate(customer: $customer, customerAccessToken: $customerAccessToken) {
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export const CUSTOMER_ADDRESS_CREATE_MUTATION = `#graphql
  mutation customerAddressCreate($address: MailingAddressInput!, $customerAccessToken: String!) {
    customerAddressCreate(address: $address, customerAccessToken: $customerAccessToken) {
      customerAddress {
        id
        firstName
        lastName
        name
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export const CUSTOMER_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation customerAddressUpdate($address: MailingAddressInput!, $customerAccessToken: String!, $id: ID!) {
    customerAddressUpdate(address: $address, customerAccessToken: $customerAccessToken, id: $id) {
      customerAddress {
        id
        firstName
        lastName
        name
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export const CUSTOMER_ADDRESS_DELETE_MUTATION = `#graphql
  mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation customerDefaultAddressUpdate($addressId: ID!, $customerAccessToken: String!) {
    customerDefaultAddressUpdate(addressId: $addressId, customerAccessToken: $customerAccessToken) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export const GET_CUSTOMER_ORDERS_QUERY = `#graphql
  query getCustomerOrders($customerAccessToken: String!, $first: Int = 20) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

export const GET_ORDER_DETAILS_QUERY = `#graphql
  query getOrderDetails($orderId: ID!) {
    node(id: $orderId) {
      ... on Order {
        id
        name
        orderNumber
        processedAt
        financialStatus
        fulfillmentStatus
        shippingAddress {
          id
          firstName
          lastName
          name
          company
          address1
          address2
          city
          province
          zip
          country
          phone
        }
        subtotalPriceV2 {
          amount
          currencyCode
        }
        totalShippingPriceV2 {
          amount
          currencyCode
        }
        totalTaxV2 {
          amount
          currencyCode
        }
        totalPriceV2 {
          amount
          currencyCode
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              variant {
                image {
                  url
                  altText
                  width
                  height
                }
                price {
                  amount
                  currencyCode
                }
              }
              discountedTotalPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`

// Cart related mutations have been moved to cart.ts
