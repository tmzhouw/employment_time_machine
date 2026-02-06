import { NextRequest, NextResponse } from 'next/server';

// Health check endpoint for Docker health checks
export async function GET(request: NextRequest) {
    return NextResponse.json(
        {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        },
        { status: 200 }
    );
}
