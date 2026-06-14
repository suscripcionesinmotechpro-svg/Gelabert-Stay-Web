import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { LOGO_B64 } from './logoData';

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

// Helpers for separator pages
async function createTenantSeparatorPage(pdfDoc: PDFDocument, name: string, role: string) {
  const page = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Solid dark charcoal background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(10 / 255, 10 / 255, 10 / 255), // Charcoal
  });

  // Gold accent border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(201 / 255, 169 / 255, 98 / 255), // Gold
    borderWidth: 2,
  });

  // Embed and draw logo
  let logoWidth = 0;
  let logoHeight = 0;
  try {
    const logoImageBytes = Buffer.from(LOGO_B64.split(',')[1] || LOGO_B64, 'base64');
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    logoHeight = 55;
    logoWidth = (logoImage.width / logoImage.height) * logoHeight;

    page.drawImage(logoImage, {
      x: 60,
      y: height - 140,
      width: logoWidth,
      height: logoHeight,
    });
  } catch (err) {
    console.error('Error embedding logo watermark in separator page:', err);
  }

  // Branded Header (shifted to the right if logo was successfully loaded)
  const textX = logoWidth > 0 ? 60 + logoWidth + 15 : 60;

  page.drawText('GELABERT HOMES', {
    x: textX,
    y: height - 100,
    size: 16,
    font: fontBold,
    color: rgb(201 / 255, 169 / 255, 98 / 255), // Gold
  });

  page.drawText('DOSSIER DE DOCUMENTACIÓN', {
    x: textX,
    y: height - 120,
    size: 10,
    font: fontRegular,
    color: rgb(150 / 255, 150 / 255, 150 / 255),
  });

  // Main Text
  page.drawText('EXPEDIENTE DE:', {
    x: 60,
    y: height / 2 + 40,
    size: 12,
    font: fontRegular,
    color: rgb(201 / 255, 169 / 255, 98 / 255), // Gold
  });

  page.drawText(name.toUpperCase(), {
    x: 60,
    y: height / 2 - 10,
    size: 24,
    font: fontBold,
    color: rgb(255 / 255, 255 / 255, 255 / 255),
  });

  page.drawText(`Rol en el Alquiler: ${role}`, {
    x: 60,
    y: height / 2 - 50,
    size: 12,
    font: fontRegular,
    color: rgb(200 / 255, 200 / 255, 200 / 255),
  });

  // Footer
  page.drawText('www.gelaberthomes.es', {
    x: 60,
    y: 60,
    size: 8,
    font: fontRegular,
    color: rgb(100 / 255, 100 / 255, 100 / 255),
  });
}

async function createDocumentSeparatorPage(pdfDoc: PDFDocument, typeLabel: string, fileName: string) {
  const page = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Light background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(250 / 255, 248 / 255, 245 / 255),
  });

  // Gold top accent line
  page.drawLine({
    start: { x: 40, y: height - 100 },
    end: { x: width - 40, y: height - 100 },
    thickness: 3,
    color: rgb(201 / 255, 169 / 255, 98 / 255), // Gold
  });

  page.drawText('DOCUMENTO APORTADO:', {
    x: 40,
    y: height - 130,
    size: 9,
    font: fontRegular,
    color: rgb(150 / 255, 150 / 255, 150 / 255),
  });

  page.drawText(typeLabel.toUpperCase(), {
    x: 40,
    y: height - 160,
    size: 18,
    font: fontBold,
    color: rgb(10 / 255, 10 / 255, 10 / 255), // Charcoal
  });

  page.drawText(`Nombre del archivo: ${fileName}`, {
    x: 40,
    y: height - 200,
    size: 10,
    font: fontRegular,
    color: rgb(100 / 255, 100 / 255, 100 / 255),
  });

  // Footer
  page.drawText('Gelabert Homes — www.gelaberthomes.es', {
    x: 40,
    y: 40,
    size: 8,
    font: fontRegular,
    color: rgb(150 / 255, 150 / 255, 150 / 255),
  });
}

function getDocumentTypeLabel(type: string) {
  switch (type) {
    case 'dni':
      return 'Documento de Identidad (DNI/NIE/Pasaporte)';
    case 'nomina':
      return 'Nómina de Salario';
    case 'contrato_trabajo':
      return 'Contrato de Trabajo / Relación Laboral';
    case 'declaracion_renta':
      return 'Declaración de la Renta / IRPF / Modelos Fiscales';
    default:
      return 'Documentación Adicional';
  }
}

export async function POST(req: Request) {
  try {
    const { contractId, tenantId } = await req.json();

    if (!contractId || !tenantId) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (contractId, tenantId)' }, { status: 400 });
    }

    const supabase = createServerSupabase(req);

    // 1. Obtener inquilino principal
    const { data: primaryTenant } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, tenant_type')
      .eq('id', tenantId)
      .single();

    if (!primaryTenant) {
      return NextResponse.json({ error: 'Inquilino principal no encontrado' }, { status: 404 });
    }

    // 2. Obtener co-inquilinos
    const { data: coTenants } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, tenant_type')
      .eq('parent_tenant_id', tenantId);

    const allTenants = [primaryTenant, ...(coTenants || [])];
    const tenantIds = allTenants.map(t => t.id);

    // 3. Obtener todos los documentos de la DB
    const { data: dbDocs } = await supabase
      .from('tenant_documents')
      .select('id, tenant_id, document_type, file_name, file_path')
      .in('tenant_id', tenantIds);

    if (!dbDocs || dbDocs.length === 0) {
      return NextResponse.json({ error: 'No se encontraron documentos en la base de datos para este grupo de inquilinos' }, { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();
    const A4_WIDTH = 595.27;
    const A4_HEIGHT = 841.89;

    // Iterar por inquilinos y compilar sus documentos
    for (const tenant of allTenants) {
      const tenantDocs = dbDocs.filter(d => d.tenant_id === tenant.id);
      if (tenantDocs.length === 0) continue;

      // Generar Portada de Inquilino
      const roleLabel = tenant.tenant_type === 'avalista' ? 'Avalista' : 'Titular';

      await createTenantSeparatorPage(mergedPdf, `${tenant.first_name} ${tenant.last_name}`, roleLabel);

      // Iterar por documentos
      for (const doc of tenantDocs) {
        const typeLabel = getDocumentTypeLabel(doc.document_type);
        await createDocumentSeparatorPage(mergedPdf, typeLabel, doc.file_name);

        const { data: fileData, error: downloadErr } = await supabase.storage.from('tenant-docs').download(doc.file_path);

        if (downloadErr || !fileData) {
          console.error(`Error descargando para fusionar: ${doc.file_path}`, downloadErr);
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const mimeType = fileData.type || '';

        try {
          if (mimeType.includes('pdf')) {
            const pdf = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          } else if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
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
          console.error(`Error al procesar archivo en pdf-lib: ${doc.file_path}`, pdfErr);
        }
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
