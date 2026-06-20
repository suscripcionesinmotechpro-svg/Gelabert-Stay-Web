// Forced rebuild to reload env variables: 2026-06-14T19:04:00
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Aumentar el tiempo de espera máximo a 60 segundos en Netlify/Next.js
export const maxDuration = 60;

// Helper to initialize Supabase server client with user's token
function createServerSupabase(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function POST(req: Request) {
  try {
    const { filePaths, additionalNotes, monthlyRent } = await req.json();

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json({ error: 'Faltan los archivos para analizar' }, { status: 400 });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.trim();

    console.log(`[API] Using Gemini API Key starting with: ${apiKey ? apiKey.substring(0, 6) : 'None'}... (Length: ${apiKey.length})`);

    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      return NextResponse.json({ 
        error: 'La API Key de Gemini no está configurada en el servidor. Por favor, configura la variable de entorno GEMINI_API_KEY en Netlify.' 
      }, { status: 500 });
    }

    const supabase = createServerSupabase(req);
    const parts: any[] = [];

    // Prompt instructivo para el análisis de solvencia
    let prompt = `Analiza las siguientes imágenes o páginas de documentos y extrae la información en un formato JSON estructurado. 
Estas páginas corresponden al mismo documento o al mismo grupo de documentos de alquiler. 
Clasifica el documento identificando todos los tipos de documentos de la siguiente lista que estén presentes en el archivo (puesto que un mismo PDF puede contener varios de ellos, como el DNI, una nómina y el contrato a la vez):
- 'dni' (DNI, NIE, Pasaporte)
- 'nomina' (Nómina de salario)
- 'contrato_trabajo' (Contrato laboral)
- 'declaracion_renta' (Impuestos, Declaración de la renta o modelos trimestrales 100/130/303)
- 'modelo_autonomo' (Modelos fiscales de autónomos, IVA/IRPF)
- 'otro' (Cualquier otro documento)

Si el archivo tiene múltiples páginas (por ejemplo, es un PDF multi-página), debes clasificar CADA página individualmente indicando su número de página (1-based, es decir, 1, 2, 3...) y el tipo de documento correspondiente de la lista anterior. Devuelve este desglose en la clave "pages".

Extrae todos los datos que puedas identificar. Si no encuentras un valor, devuélvelo como null.

Es MUY importante que identifiques el nombre y apellidos del inquilino al que pertenecen. 

En el campo "notes" de "extracted_data", debes proporcionar un resumen ejecutivo redactado de la solvencia del inquilino.
Reglas estrictas para el resumen en "notes":
1. Debe ser un texto fluido y redactado profesionalmente describiendo el perfil laboral y financiero del inquilino. Ejemplo correcto: "El inquilino Carlos Ramon Tapias Peña es empleado con contrato indefinido como Mozo Especialista en VILLALOBOS LOGISTICA S.L. Su antigüedad laboral es desde el 24 de junio de 2020. Sus ingresos netos mensuales, según las últimas nóminas, oscilan entre 1388.31€ y 1612.46€. Posee un permiso de residencia y trabajo válido."
2. NO debe mencionar qué documentos se han presentado ni detallar el listado de archivos (EVITA frases como: "Se han proporcionado tres nóminas correspondientes a febrero, marzo y abril de 2026, con ingresos netos mensuales de 2136.34€...").
3. Si el archivo contiene nóminas de múltiples meses (ej. marzo, abril, mayo), especifica detalladamente los ingresos netos de cada mes en el texto (ej. "habiendo percibido 2130€ en marzo, 2400€ en abril...").
4. Céntrate en la información sustancial del perfil laboral, tipo de contrato, antigüedad laboral, e ingresos netos.

Devuelve la respuesta en formato JSON que cumpla exactamente con este esquema:
{
  "document_type": "dni" | "nomina" | "contrato_trabajo" | "declaracion_renta" | "modelo_autonomo" | "otro", (El tipo de documento principal o más relevante)
  "document_types": ["dni", "nomina", "contrato_trabajo", "declaracion_renta", "modelo_autonomo", "otro"], (Lista conteniendo TODOS los tipos de documentos identificados en el archivo)
  "pages": [
    {
      "page_number": 1,
      "document_types": ["dni"] (Lista de tipos de documentos presentes en esta página concreta. Si una página contiene a la vez un DNI y una nómina, ponlos ambos: ["dni", "nomina"])
    }
  ],
  "confidence": 0.0 a 1.0,
  "extracted_data": {
    "first_name": "Nombre de pila del inquilino (texto o null)",
    "last_name": "Apellidos del inquilino (texto o null)",
    "dni": "Número de DNI/NIE/Pasaporte limpio (texto o null)",
    "employment_status": "empleado" | "autónomo" | "desempleado" | "pensionista" | "estudiante" | null,
    "company_name": "Nombre de la empresa empleadora (texto o null)",
    "job_title": "Puesto o cargo laboral (texto o null)",
    "seniority_date": "Fecha de inicio de antigüedad laboral en formato YYYY-MM-DD (texto o null)",
    "contract_type": "indefinido" | "temporal" | "otro" | null,
    "monthly_income": 1250.50 (Salario neto mensual extraído de nómina como número, o null),
    "annual_income": 18500.00 (Ingresos netos anuales extraídos de declaración de la renta como número, o null),
    "currency": "EUR" | "BRL" | "USD" | "GBP" | null, (Código de la moneda de los ingresos o extractos, ej. 'EUR' para euros €, 'BRL' para reales brasileños R$, 'USD' para dólares $, etc. Default a 'EUR' si son documentos españoles),
    "age": 32 (Edad del inquilino como número entero, o null. Dúcela a partir de su fecha de nacimiento en el DNI si está disponible),
    "nationality": "Nacionalidad o país de origen del inquilino (texto o null, ej. 'española', 'italiana', 'colombiana')",
    "document_date": "Fecha del documento en formato YYYY-MM-DD (texto o null)",
    "notes": "Resumen ejecutivo de solvencia y perfil laboral siguiendo las reglas estrictas (texto o null)"
  }
}`;

    if (monthlyRent) {
      prompt += `\n\nLA RENTA PROPUESTA PARA ESTE ALQUILER ES DE: ${monthlyRent}€ al mes.
Por favor, calcula la tasa de esfuerzo (ratio de ingresos netos mensuales del inquilino vs esta renta de ${monthlyRent}€) para el inquilino. En el resumen de solvencia ("notes"), incluye este análisis de esfuerzo de forma fluida (ej. indicando qué porcentaje de sus ingresos netos representa la renta y si se considera un esfuerzo financiero de riesgo bajo, moderado o alto).`;
    }

    parts.push({ text: prompt });

    if (additionalNotes && additionalNotes.trim() !== '') {
      parts.push({
        text: `INFORMACIÓN ADICIONAL Y NOTAS DEL AGENTE SOBRE EL PERFIL DE LOS INQUILINOS:\n${additionalNotes}\n\nUsa esta información para complementar, validar o rellenar campos que no figuren en los archivos (como la edad, nacionalidad, ingresos o situación laboral) y enriquecer el resumen final.`
      });
    }

    // Descargar archivos de Supabase Storage y convertirlos a Base64 para Gemini
    for (const filePath of filePaths) {
      const { data, error } = await supabase.storage.from('tenant-docs').download(filePath);

      if (error || !data) {
        console.error(`Error descargando archivo ${filePath}:`, error);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const mimeType = data.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    if (parts.length === 1) {
      return NextResponse.json({ error: 'No se pudieron descargar los archivos para analizar' }, { status: 400 });
    }

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
      console.error('Error de Gemini API:', errText);
      return NextResponse.json({ error: `Error en la llamada a Gemini: ${response.statusText}` }, { status: 500 });
    }

    const resJson = await response.json();
    const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return NextResponse.json({ error: 'La IA no devolvió ningún resultado interpretable' }, { status: 500 });
    }

    // Parsear el JSON retornado por la IA
    const analysis = JSON.parse(textResult.trim());
    return NextResponse.json(analysis);

  } catch (err: any) {
    console.error('Error en analyze-tenant-docs:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
