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

    prompt += `REGLAS CRÍTICAS DE REDACCIÓN Y CONSOLIDACIÓN (SIEMPRE EN ESPAÑOL):
1. **Consolidación de Datos Estructurados**: Debes deducir y consolidar todos los campos del perfil del inquilino a partir del conjunto de documentos presentados.
   - Para el nombre, apellidos, DNI/NIE, edad y nacionalidad, elige los valores más completos y correctos disponibles en los documentos.
   - Para el estado de empleo (employment_status) y tipo de contrato (contract_type), mapea los valores a los permitidos en español ('empleado', 'autónomo', etc. e 'indefinido', 'temporal', etc.).
   - Para los ingresos netos mensuales (monthly_income), debes consolidar la cantidad real de ingresos del inquilino demostrada a lo largo de los documentos. Por ejemplo, si hay una nómina, un contrato de trabajo o extractos/certificados bancarios que demuestran ingresos recurrentes (como depósitos mensuales promedio de $7,200 USD), calcula e introduce este valor de ingresos en el campo "monthly_income" y especifica la moneda original en el campo "currency" (ej. "USD"). NO devuelvas 0 ni null si hay ingresos demostrados en los documentos (incluso si son extranjeros o provienen de extractos o certificados bancarios).
   - Para la moneda (currency), especifica el código de tres letras (EUR, USD, GBP, BRL, etc.) correspondiente a los ingresos indicados en "monthly_income".
2. **Consolidación de Notas (Resumen Ejecutivo)**: Crea un único párrafo continuo y fluido que sintetice todo el perfil del inquilino, teniendo en cuenta la totalidad de los documentos aportados. No analices documento por documento de forma separada ni repitas información redundante.
3. **Análisis de Esfuerzo Financiero**: Si se especifica la renta mensual, calcula y analiza la tasa de esfuerzo en relación con los ingresos mensuales netos totales demostrados (realizando la conversión aproximada de divisas a euros si están en moneda extranjera, ej. $7,200 USD ≈ 6,700 EUR). Indica qué porcentaje de los ingresos netos representa el alquiler y el nivel de riesgo financiero asociado (Riesgo Bajo: <30%, Moderado: 30-40%, Alto: >40%).
4. **Resolución de Inconsistencias**: Analiza el conjunto de datos de forma lógica. Por ejemplo, si un documento anterior sugería que no tenía ingresos o arraigo en España, pero otro documento aporta un contrato laboral indefinido español o ingresos bancarios sólidos en España, aclara la situación real mostrando la solvencia demostrada y explicando la compatibilidad de los documentos de forma coherente.
5. **Estilo Profesional**: El resumen debe ser redactado en español con un tono formal, claro y directo. Debe ser apto para presentarse al propietario de la vivienda.
6. **No listes archivos**: Evita redactar una lista de los archivos aportados (por ejemplo, evita "Se ha aportado un PDF con la nómina de marzo..."). Céntrate directamente en los datos financieros y laborales demostrados: nombre del inquilino, cargo, empresa, antigüedad, tipo de contrato, ingresos netos demostrados, edad y nacionalidad.
7. **Ingresos Extranjeros**: El análisis de riesgo y la tasa de esfuerzo deben realizarse basándose en la cantidad total de ingresos demostrados, independientemente de si provienen de España o del extranjero. **Bajo ningún concepto** consideres un perfil como de riesgo o alerta crítica solo porque la documentación o los ingresos procedan de fuera de España o estén en otra moneda. Si los ingresos convertidos a euros son muy superiores a la renta propuesta (ej. ingresos de 7200 USD frente a una renta de 1350€), describe el riesgo financiero como riesgo bajo, detallando la conversión de forma totalmente neutra y profesional.
8. **Idioma**: Aunque parte de los datos provengan de documentos originalmente en otros idiomas (como inglés o italiano), el resumen ejecutivo final debe ser redactado única y exclusivamente en ESPAÑOL.

Devuelve la respuesta en formato JSON que cumpla exactamente con este esquema:
{
  "first_name": "Nombre de pila del inquilino (texto o null)",
  "last_name": "Apellidos del inquilino (texto o null)",
  "dni": "Número de DNI/NIE/Pasaporte limpio (texto o null)",
  "employment_status": "empleado" | "autónomo" | "desempleado" | "pensionista" | "estudiante" | null,
  "company_name": "Nombre de la empresa empleadora (texto o null)",
  "job_title": "Puesto o cargo laboral (texto o null, traducido al español o en su forma original)",
  "seniority_date": "Fecha de inicio de antigüedad laboral en formato YYYY-MM-DD (texto o null)",
  "contract_type": "indefinido" | "temporal" | "otro" | null,
  "monthly_income": 7200.00 (Salario o ingresos netos mensuales consolidados de todas las fuentes demostradas como número, o null. Utiliza la cantidad en la moneda original indicada en 'currency'),
  "currency": "EUR" | "BRL" | "USD" | "GBP" | null (Código de la moneda correspondiente a 'monthly_income'),
  "age": 40 (Edad del inquilino como número entero, o null),
  "nationality": "Nacionalidad o país de origen del inquilino (texto o null)",
  "notes": "Resumen ejecutivo de solvencia y perfil laboral consolidado en ESPAÑOL, siguiendo todas las reglas descritas (texto o null)"
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
