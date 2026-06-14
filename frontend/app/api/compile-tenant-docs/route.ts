import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

// Helper to initialize Supabase server client with user's token
function createServerSupabase(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function POST(req: Request) {
  try {
    const { contractId, tenantId, filePaths } = await req.json();

    if (!contractId || !tenantId || !filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (contractId, tenantId, filePaths)' }, { status: 400 });
    }

    const supabase = createServerSupabase(req);
    const mergedPdf = await PDFDocument.create();

    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;

    for (const filePath of filePaths) {
      const { data, error } = await supabase.storage.from('tenant-docs').download(filePath);

      if (error || !data) {
        console.error(`Error descargando para fusionar: ${filePath}`, error);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const mimeType = data.type || '';

      try {
        if (mimeType.includes('pdf')) {
          // Cargar PDF existente y copiar todas sus páginas
          const pdf = await PDFDocument.load(buffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } else if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
          // Insertar imagen JPEG y escalarla a A4
          const image = await mergedPdf.embedJpg(buffer);
          let width = image.width;
          let height = image.height;

          const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
          width = width * scale;
          height = height * scale;

          const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
          const x = (A4_WIDTH - width) / 2;
          const y = (A4_HEIGHT - height) / 2;

          page.drawImage(image, { x, y, width, height });
        } else if (mimeType.includes('image/png')) {
          // Insertar imagen PNG y escalarla a A4
          const image = await mergedPdf.embedPng(buffer);
          let width = image.width;
          let height = image.height;

          const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
          width = width * scale;
          height = height * scale;

          const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
          const x = (A4_WIDTH - width) / 2;
          const y = (A4_HEIGHT - height) / 2;

          page.drawImage(image, { x, y, width, height });
        } else {
          console.warn(`Tipo de archivo no soportado para fusionar en PDF: ${mimeType}`);
        }
      } catch (pdfErr) {
        console.error(`Error al procesar archivo en pdf-lib: ${filePath}`, pdfErr);
      }
    }

    // Verificar si el documento resultante tiene páginas
    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json({ error: 'No se pudo generar el PDF consolidado porque ningún documento fue compatible' }, { status: 400 });
    }

    // Guardar el documento final en un Buffer
    const mergedPdfBytes = await mergedPdf.save();
    const compiledBuffer = Buffer.from(mergedPdfBytes);

    // Subir el PDF resultante a Supabase Storage
    const compiledPath = `${contractId}/expediente_consolidado_${tenantId}.pdf`;
    
    const { error: uploadErr } = await supabase.storage
      .from('tenant-docs')
      .upload(compiledPath, compiledBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      throw uploadErr;
    }

    // Generar URL firmada por 1 año
    const { data: urlData } = await supabase.storage
      .from('tenant-docs')
      .createSignedUrl(compiledPath, 60 * 60 * 24 * 365);

    const fileUrl = urlData?.signedUrl ?? '';

    return NextResponse.json({
      success: true,
      filePath: compiledPath,
      fileUrl,
      fileName: `expediente_consolidado_${tenantId}.pdf`,
    });

  } catch (err: any) {
    console.error('Error en compile-tenant-docs:', err);
    return NextResponse.json({ error: err.message || 'Error interno al compilar documentos' }, { status: 500 });
  }
}
