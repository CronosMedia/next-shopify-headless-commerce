
import { NextResponse } from 'next/server';
import {serverLogger} from '@/lib/logger.server'

export async function POST(request: Request) {
    try {
        const body: unknown = await request.json();
        const name =
            typeof body === 'object' && body !== null && 'name' in body
                ? body.name
                : null
        const email =
            typeof body === 'object' && body !== null && 'email' in body
                ? body.email
                : null
        const message =
            typeof body === 'object' && body !== null && 'message' in body
                ? body.message
                : null

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof message !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            !message.trim()
        ) {
            return NextResponse.json(
                { error: { message: 'Toate câmpurile sunt obligatorii.' } },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: {
                    message:
                        'Formularul de contact nu este configurat momentan.',
                },
            },
            { status: 503 }
        );
    } catch (error) {
        serverLogger.error('contact.invalid_request', error)
        return NextResponse.json(
            { error: { message: 'A apărut o eroare la trimiterea mesajului.' } },
            { status: 400 }
        );
    }
}
