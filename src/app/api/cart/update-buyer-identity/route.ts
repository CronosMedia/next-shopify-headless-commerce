import { NextRequest, NextResponse } from 'next/server';
import { cartBuyerIdentityUpdate } from '@/lib/cart'; // Import the server-side function
import { CartBuyerIdentityInput } from '@/lib/types'; // Assuming this type is correct
import {normalizeRomanianPhoneForShopify} from '@/lib/phone'

function normalizeBuyerIdentityPhone(
  buyerIdentity: CartBuyerIdentityInput
): CartBuyerIdentityInput {
  return {
    ...buyerIdentity,
    phone: normalizeRomanianPhoneForShopify(buyerIdentity.phone) ?? undefined,
    deliveryAddressPreferences: buyerIdentity.deliveryAddressPreferences?.map((preference) => ({
      ...preference,
      deliveryAddress: preference.deliveryAddress
        ? {
            ...preference.deliveryAddress,
            phone: normalizeRomanianPhoneForShopify(preference.deliveryAddress.phone) ?? undefined,
          }
        : undefined,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cartId, buyerIdentity }: { cartId: string; buyerIdentity: CartBuyerIdentityInput } = await request.json();

    if (!cartId || !buyerIdentity) {
      return NextResponse.json({ error: 'cartId and buyerIdentity are required' }, { status: 400 });
    }

    const updatedCart = await cartBuyerIdentityUpdate(
      cartId,
      normalizeBuyerIdentityPhone(buyerIdentity)
    );
    return NextResponse.json({ cart: updatedCart });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update buyer identity via API',
      },
      {status: 500}
    )
  }
}
