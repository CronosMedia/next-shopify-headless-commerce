import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// This is a mock email sending function.
// In a real app, you'd use a service like SendGrid, Resend, or Nodemailer.
async function sendCancellationRequestEmail({
  orderName,
  customerEmail,
  adminEmail,
}: {
  orderName: string
  customerEmail: string
  adminEmail: string
}) {
  console.log('--- New Order Cancellation Request ---')
  console.log(`Recipient: ${adminEmail}`)
  console.log(`From: ${customerEmail}`)
  console.log(`Subject: Cancellation Request for Order ${orderName}`)
  console.log(
    `Body: The customer (${customerEmail}) has requested to cancel order ${orderName}. Please review this request in your Shopify admin panel.`
  )
  console.log('------------------------------------')
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

export const POST = async (req: NextRequest) => {
  try {
    // First, verify the user is logged in
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer-access-token')?.value
    if (!accessToken) {
      return Response.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { orderName, customerEmail } = await req.json()

    // In a real app, you would get this from your environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'

    if (!orderName || !customerEmail) {
      return Response.json(
        { error: { message: 'Order name and customer email are required.' } },
        { status: 400 }
      )
    }

    const result = await sendCancellationRequestEmail({
      orderName,
      customerEmail,
      adminEmail,
    })

    if (result.success) {
      return Response.json({
        success: true,
        message: 'Cancellation request sent.',
      })
    } else {
      throw new Error('Failed to send cancellation email.')
    }
  } catch (error: unknown) {
    return Response.json(
      {
        error: {
          message: error.message || 'Failed to process cancellation request.',
        },
      },
      { status: 500 }
    )
  }
}
