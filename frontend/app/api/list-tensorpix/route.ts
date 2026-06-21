import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tensorpixKey = (process.env.TENSORPIX_API_KEY || '').trim();
    if (!tensorpixKey || tensorpixKey === 'undefined' || tensorpixKey === 'null') {
      return NextResponse.json({ error: 'TENSORPIX_API_KEY no está configurada' }, { status: 400 });
    }

    const res = await fetch('https://backend.tensorpix.ai/api/ml-models/', {
      headers: {
        'Authorization': `Token ${tensorpixKey}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Error de TensorPix: ${res.statusText}`, detail: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, models: data });
  } catch (err: any) {
    console.error('[TensorPix List Models Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
