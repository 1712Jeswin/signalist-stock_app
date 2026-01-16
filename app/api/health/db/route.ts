import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const db = await connectToDatabase();
    const readyState = db.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    return NextResponse.json(
      {
        ok: readyState === 1,
        status: states[readyState] ?? 'unknown',
        readyState,
        elapsedMs: Date.now() - startedAt,
        env: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        message,
        elapsedMs: Date.now() - startedAt,
        env: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
