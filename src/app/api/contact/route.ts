
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message } = body;

        // Validate input
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: { message: 'Toate câmpurile sunt obligatorii.' } },
                { status: 400 }
            );
        }

        // In a real application, you would send an email here using a service like Resend, SendGrid, or Nodemailer.
        // For now, we will log the message to the console to simulate sending.
        console.log('--- Contact Form Submission ---');
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Message: ${message}`);
        console.log('-------------------------------');

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: { message: 'A apărut o eroare la trimiterea mesajului.' } },
            { status: 500 }
        );
    }
}
