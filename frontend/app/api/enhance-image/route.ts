import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen para analizar' }, { status: 400 });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      return NextResponse.json({ 
        error: 'La API Key de Gemini no está configurada en el servidor.' 
      }, { status: 500 });
    }

    // Prepare prompt specifically tuned for real estate photo color/exposure optimization
    const prompt = `Analiza esta fotografía de una propiedad inmobiliaria (interior o exterior).
Determina los ajustes de brillo (brightness), contraste (contrast) y saturación (saturation) idóneos para embellecer la imagen, hacer los espacios más luminosos, vivos y profesionales, pero sin alterar en absoluto los elementos de la escena, ni añadir ruido, ni quemar los blancos.

Rango de valores permitidos (donde 1.0 representa el valor original sin cambios):
- brightness: de 0.95 a 1.25 (valores superiores a 1.0 aumentan la luz, valores inferiores la reducen si es demasiado brillante)
- contrast: de 0.95 a 1.15 (valores superiores a 1.0 aumentan la diferencia entre sombras y luces)
- saturation: de 0.95 a 1.15 (valores superiores a 1.0 avivan los colores de maderas, paredes, plantas, etc.)

Reglas de decisión:
- Si el espacio es oscuro (habitación poco iluminada o con luz escasa), el brillo debe subir a 1.12 - 1.25.
- Si la foto está apagada o plana de color, el contraste y la saturación deben subir a 1.05 - 1.12.
- Si la foto ya está bien expuesta y es muy luminosa, mantén el brillo en 1.0 o 1.02.
- Evita valores extremos que deformen el realismo.

Devuelve la respuesta estrictamente en formato JSON con la siguiente estructura:
{
  "brightness": 1.10,
  "contrast": 1.05,
  "saturation": 1.05
}`;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      },
    ];

    // Call Gemini API (using gemini-2.5-flash as done in analyze-tenant-docs)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Enhance Image API] Gemini call error:', errText);
      return NextResponse.json({ error: `Error en la llamada a Gemini: ${response.statusText}` }, { status: 500 });
    }

    const resJson = await response.json();
    const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return NextResponse.json({ error: 'No se obtuvo respuesta del modelo de análisis' }, { status: 500 });
    }

    try {
      const resultJson = JSON.parse(textResult.trim());
      return NextResponse.json(resultJson);
    } catch (parseErr) {
      console.error('[Enhance Image API] Failed to parse Gemini response text:', textResult);
      // Fallback values
      return NextResponse.json({
        brightness: 1.08,
        contrast: 1.04,
        saturation: 1.05
      });
    }
  } catch (err: any) {
    console.error('[Enhance Image API] Error in enhance-image API route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
