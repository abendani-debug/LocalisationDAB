import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('[Contact B2B]', body)
  // TODO: brancher Resend ou Formspree ici
  return NextResponse.json({ success: true })
}
