import { NextRequest, NextResponse } from 'next/server';
import { cartBuyerIdentityUpdate } from '@/lib/cart'; // Import the server-side function
import { CartBuyerIdentityInput } from '@/lib/types'; // Assuming this type is correct

export async function POST(request: NextRequest) {
  try {
    const { cartId, buyerIdentity }: { cartId: string; buyerIdentity: CartBuyerIdentityInput } = await request.json();

    if (!cartId || !buyerIdentity) {
      return NextResponse.json({ error: 'cartId and buyerIdentity are required' }, { status: 400 });
    }

    const updatedCart = await cartBuyerIdentityUpdate(cartId, buyerIdentity);
    return NextResponse.json({ cart: updatedCart });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update buyer identity via API' }, { status: 500 });
  }
}
