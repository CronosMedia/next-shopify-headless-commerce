import { NextRequest } from 'next/server'
import {
  cartBuyerIdentityUpdate,
  cartCreate,
  cartGet,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
} from '@/lib/cart'

async function handler(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, cartId, lines, lineIds, buyerIdentity } = body || {}

    switch (action) {
      case 'get':
        if (!cartId) throw new Error('cartId required')
        const cart = await cartGet(cartId)
        return Response.json({ cart })

      case 'create':
        try {
          // Validate lines if provided
          if (
            lines &&
            (!Array.isArray(lines) || lines.some((line) => !line.merchandiseId))
          ) {
            return Response.json(
              { error: { message: 'Invalid lines format' } },
              { status: 400 }
            )
          }

          const newCart = await cartCreate(lines)
          if (!newCart) {
            console.error(
              'Cart creation failed - no cart returned from Shopify'
            )
            return Response.json(
              { error: { message: 'Cart creation failed' } },
              { status: 500 }
            )
          }
          return Response.json({ cart: newCart })
        } catch (error) {
          console.error('Cart creation failed:', error)
          return Response.json(
            {
              error: {
                message: `Failed to create cart: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              },
            },
            { status: 500 }
          )
        }

      case 'updateDeliveryAddress':
        if (!cartId || !body.address)
          throw new Error('cartId and address required')
        try {
          const deliveryCart = await cartBuyerIdentityUpdate(cartId, {
            deliveryAddressPreferences: [
              {
                ...body.address,
              },
            ],
          })
          if (!deliveryCart)
            throw new Error('Failed to update delivery address')
          return Response.json({ cart: deliveryCart })
        } catch (error) {
          throw new Error(
            `Failed to update delivery address: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        }

      case 'add_lines':
        if (!cartId || !lines) throw new Error('cartId and lines required')
        const addedCart = await cartLinesAdd(cartId, lines)
        return Response.json({ cart: addedCart })

      case 'update_lines':
        if (!cartId || !lines) throw new Error('cartId and lines required')
        const updatedCart = await cartLinesUpdate(cartId, lines)
        return Response.json({ cart: updatedCart })

      case 'remove_lines':
        if (!cartId || !lineIds) throw new Error('cartId and lineIds required')
        const removedCart = await cartLinesRemove(cartId, lineIds)
        return Response.json({ cart: removedCart })

      case 'update_buyer':
        if (!cartId || !buyerIdentity)
          throw new Error('cartId and buyerIdentity required')
        const buyerCart = await cartBuyerIdentityUpdate(cartId, buyerIdentity)
        return Response.json({ cart: buyerCart })

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    // This block will now catch any error thrown from the cart library
    // and return a proper JSON error response instead of crashing the server.
    // We check if the error is an array (from Shopify) and format it.
    let message: string

    if (Array.isArray(error)) {
      message = error
        .map((e) => (e instanceof Error ? e.message : String(e)))
        .join(', ')
    } else if (error instanceof Error) {
      message = error.message
    } else {
      message = 'An unexpected error occurred in the cart API.'
    }

    return Response.json(
      {
        error: { message },
      },
      { status: 500 }
    )
  }
}

export const POST = handler
