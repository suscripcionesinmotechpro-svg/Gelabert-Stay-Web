import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { tenantDocuments, monthlyRent, additionalNotes } = await req.json();

    if (!tenantDocuments || !Array.isArray(tenantDocuments) || tenantDocuments.length === 0) {
      return NextResponse.json({ error: 'Faltan los datos extraídos de los documentos' }, { status: 400 });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      return NextResponse.json({ 
        error: 'La API Key de Gemini no está configurada en el servidor.' 
      }, { status: 500 });
    }

    // Construir la lista legible de documentos y sus datos estructurados
    let docsDescription = '';
    tenantDocuments.forEach((doc, idx) => {
      docsDescription += `--- Documento ${idx + 1} (${doc.document_type || 'otro'}) ---\n`;
      docsDescription += JSON.stringify(doc.extracted_data || {}, null, 2) + '\n\n';
    });

    // Prompt instructivo optimizado en español
    let prompt = `Eres un analista de riesgos financieros experto en el sector inmobiliario de España.
Tu tarea es analizar la información estructurada extraída de múltiples documentos presentados por un posible inquilino y redactar un único resumen ejecutivo de solvencia consolidado y coherente.

INFORMACIÓN EXTRAÍDA DE LOS DOCUMENTOS DEL INQUILINO:
${docsDescription}
`;

    if (monthlyRent) {
      prompt += `RENTA MENSUAL DEL ALQUILER PROPUESTO:
${monthlyRent}€ al mes.

`;
    }

    if (additionalNotes && additionalNotes.trim() !== '') {
      prompt += `INFORMACIÓN ADICIONAL Y NOTAS DEL AGENTE SOBRE EL PERFIL DE LOS INQUILINOS:
${additionalNotes}

`;
    }

    prompt += `REGLAS CRÍTICAS DE REDACCIÓN DEL RESUMEN EJECUTIVO (SIEMPRE EN ESPAÑOL):
1. **Consolidación Holística**: Debes crear un único párrafo o texto continuo y fluido que sintetice todo el perfil del inquilino, teniendo en cuenta la totalidad de los documentos aportados. No analices documento por documento de forma separada ni repitas información redundante.
2. **Análisis de Esfuerzo Financiero**: Si se especifica la renta mensual, calcula y analiza la tasa de esfuerzo en relación con los ingresos mensuales netos totales demostrados del inquilino. Indica qué porcentaje de los ingresos netos representa el alquiler y el nivel de riesgo financiero asociado (Riesgo Bajo: <30%, Moderado: 30-40%, Alto: >40%).
3. **Resolución de Inconsistencias**: Analiza el conjunto de datos de forma lógica. Por ejemplo, si un documento anterior sugería que no tenía ingresos o arraigo en España, pero otro documento aporta un contrato laboral indefinido español o ingresos bancarios sólidos en España, aclara la situación real mostrando la solvencia demostrada y explicando la compatibilidad de los documentos de forma coherente.
4. **Estilo Profesional**: El resumen debe ser redactado en español con un tono formal, claro y directo. Debe ser apto para presentarse al propietario de la vivienda.
5. **No listes archivos**: Evita redactar una lista de los archivos aportados (por ejemplo, evita "Se ha aportado un PDF con la nómina de marzo..."). Céntrate directamente en los datos financieros y laborales demostrados: nombre del inquilino, cargo, empresa, antigüedad, tipo de contrato, ingresos netos demostrados, edad y nacionalidad.
6. **Ingresos Extranjeros**: El análisis de riesgo y la tasa de esfuerzo deben realizarse basándose en la cantidad total de ingresos demostrados, independientemente de si provienen de España o del extranjero. Si los ingresos están en otra moneda (ej. USD, GBP, BRL), realiza una conversión aproximada a euros (EUR) en tu análisis y calcula la tasa de esfuerzo sobre esa cifra convertida. **Bajo ningún concepto** consideres un perfil como de riesgo o alerta crítica solo porque la documentación o los ingresos procedan de fuera de España o estén en otra moneda. Si los ingresos convertidos a euros son muy superiores a la renta propuesta (ej. ingresos de 9000 USD frente a una renta de 1350€), describe el riesgo financiero como riesgo bajo, detallando la conversión de forma totalmente neutra y profesional.
7. **Idioma**: Aunque parte de los datos provengan de documentos originalmente en otros idiomas (como inglés o italiano), el resumen ejecutivo final debe ser redactado única y exclusivamente en ESPAÑOL.

Devuelve la respuesta en formato JSON que cumpla exactamente con este esquema:
{
  "notes": "Resumen ejecutivo de solvencia y perfil laboral consolidado en ESPAÑOL, siguiendo todas las reglas descritas."
}`;

    // Llamar a Gemini API (Modelo Gemini 2.5 Flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de Gemini API en synthesis:', errText);
      return NextResponse.json({ error: `Error en la llamada a Gemini: ${response.statusText}` }, { status: 500 });
    }

    const resJson = await response.json();
    const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return NextResponse.json({ error: 'La IA no devolvió ningún resultado interpretable para la síntesis' }, { status: 500 });
    }

    const result = JSON.parse(textResult.trim());
    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Error en synthesize-tenant-notes:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
