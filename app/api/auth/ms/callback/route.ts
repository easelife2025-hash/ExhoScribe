import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // Without a real client_secret, we cannot exchange the token here in preview without actual credentials.
  // In a real implementation, you would exchange the code with Microsoft Graph.
  // For now, we will return the code back to the client to indicate auth failure or just pass an error.
  
  const html = `<!DOCTYPE html>
    <html lang="en">
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Microsoft OAuth requires client_secret configuration.' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication failed. Please configure Microsoft OAuth secrets.</p>
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    }
  });
}
