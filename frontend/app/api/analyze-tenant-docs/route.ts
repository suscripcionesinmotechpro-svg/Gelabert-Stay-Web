// Forced rebuild to reload env variables: 2026-06-14T19:04:00
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { filePaths, additionalNotes } = await req.json();

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
    const prompt = `Analiza las siguientes imágenes o páginas de documentos y extrae la información en un formato JSON estructurado. 
Estas páginas corresponden al mismo documento o al mismo grupo de documentos de alquiler. 
Clasifica el documento en una de las siguientes categorías: 
- 'dni' (DNI, NIE, Pasaporte)
- 'nomina' (Nómina de salario)
- 'contrato_trabajo' (Contrato laboral)
- 'declaracion_renta' (Impuestos, Declaración de la renta o modelos trimestrales 100/130/303)
- 'otro' (Cualquier otro documento)

Extrae todos los datos que puedas identificar. Si no encuentras un valor, devuélvelo como null.

Es MUY importante que identifiques el nombre y apellidos del inquilino al que pertenecen. 
Si el documento tiene varias páginas (como un contrato de trabajo de 10 hojas), analiza todas las páginas juntas para extraer la información global.

Devuelve la respuesta en formato JSON que cumpla exactamente con este esquema:
{
  "document_type": "dni" | "nomina" | "contrato_trabajo" | "declaracion_renta" | "otro",
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
    "age": 32 (Edad del inquilino como número entero, o null. Dúcela a partir de su fecha de nacimiento en el DNI si está disponible),
    "nationality": "Nacionalidad o país de origen del inquilino (texto o null, ej. 'española', 'italiana', 'colombiana')",
    "document_date": "Fecha del documento en formato YYYY-MM-DD (texto o null)",
    "notes": "Breve resumen de solvencia (texto o null)"
  }
}`;

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
