import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/ms/callback`;
  
  const clientId = process.env.NEXT_PUBLIC_MS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Microsoft OAuth client_id is not configured.' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'offline_access Calendars.Read User.Read',
    state: 'some_state',
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  return NextResponse.json({ url: authUrl });
}
