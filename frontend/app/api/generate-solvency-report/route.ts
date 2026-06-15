import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
    const { tenantId, monthlyRent } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta el ID del inquilino (tenantId)' }, { status: 400 });
    }

    const rentPrice = monthlyRent ? Number(monthlyRent) : 0;
    const supabase = createServerSupabase(req);

    // 1. Obtener inquilino principal
    // 1. Obtener inquilino inicial
    const { data: initialTenant, error: primaryErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (primaryErr || !initialTenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Si es un co-inquilino, buscar el inquilino principal real
    let primaryTenant = initialTenant;
    const parentId = initialTenant.parent_tenant_id;
    if (parentId) {
      const { data: parentTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', parentId)
        .single();
      if (parentTenant) {
        primaryTenant = parentTenant;
      }
    }

    // 2. Obtener co-inquilinos asociados al inquilino principal
    const { data: coTenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('parent_tenant_id', primaryTenant.id);

    const allTenants = [primaryTenant, ...(coTenants || [])];

    // 3. Obtener los documentos subidos de este grupo para hacer un checklist
    // Necesitamos buscar los documentos vinculados a estas personas
    const tenantIds = allTenants.map(t => t.id);
    const { data: docs } = await supabase
      .from('tenant_documents')
      .select('document_type, file_name, tenant_id')
      .in('tenant_id', tenantIds);

    // 4. Crear documento PDF
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([595.27, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Paleta de colores Gelabert Homes
    const colorGold = rgb(201 / 255, 169 / 255, 98 / 255); // #C9A962
    const colorCharcoal = rgb(10 / 255, 10 / 255, 10 / 255); // #0A0A0A
    const colorGrey = rgb(102 / 255, 102 / 255, 102 / 255); // #666666
    const colorLightGrey = rgb(230 / 255, 230 / 255, 230 / 255);
    const colorGreen = rgb(76 / 255, 175 / 255, 80 / 255);
    const colorRed = rgb(244 / 255, 67 / 255, 54 / 255);
    const colorYellow = rgb(255 / 255, 193 / 255, 7 / 255);

    // Helpers para multipágina
    let currentPage = page;

    function createNewPage() {
      const newPage = pdfDoc.addPage([595.27, 841.89]);
      
      // Cabecera simplificada
      newPage.drawRectangle({
        x: 0,
        y: height - 50,
        width: width,
        height: 50,
        color: colorCharcoal,
      });

      newPage.drawLine({
        start: { x: 0, y: height - 50 },
        end: { x: width, y: height - 50 },
        thickness: 2,
        color: colorGold,
      });

      newPage.drawText('GELABERT HOMES — ESTUDIO DE SOLVENCIA', {
        x: 40,
        y: height - 32,
        size: 9,
        font: fontHelveticaBold,
        color: colorGold,
      });

      // Pie de página corporativo
      newPage.drawText('Gelabert Homes — www.gelaberthomes.es', {
        x: 40,
        y: 25,
        size: 8,
        font: fontHelvetica,
        color: colorGrey,
      });

      return newPage;
    }

    function drawParagraph(text: string, titleText?: string) {
      if (titleText) {
        if (currentY - 25 < 55) {
          currentPage = createNewPage();
          currentY = height - 80;
        }
        currentPage.drawText(titleText, {
          x: 40,
          y: currentY,
          size: 9,
          font: fontHelveticaBold,
          color: colorCharcoal,
        });
        currentY -= 15;
      }

      // Separar el texto en párrafos por saltos de línea primero para evitar el error de WinAnsi con \n
      const rawParagraphs = text.split(/\r?\n/);
      
      for (const paragraph of rawParagraphs) {
        if (paragraph.trim() === '') {
          currentY -= 8; // Salto de línea vacío
          continue;
        }

        const words = paragraph.split(' ');
        let line = '';
        const lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const testWidth = fontHelvetica.widthOfTextAtSize(testLine, 8.5);
          if (testWidth > width - 100 && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        for (const lineStr of lines) {
          if (currentY - 14 < 55) {
            currentPage = createNewPage();
            currentY = height - 80;
          }
          currentPage.drawText(lineStr, {
            x: 45,
            y: currentY,
            size: 8,
            font: fontHelvetica,
            color: colorGrey,
          });
          currentY -= 12;
        }
        currentY -= 4; // Espacio pequeño entre párrafos del mismo bloque
      }
      currentY -= 8; // Espacio final
    }

    // DIBUJAR CABECERA BRANDED (Primera página)
    // Fondo de cabecera oscura
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: colorCharcoal,
    });

    // Línea de acento dorado
    page.drawLine({
      start: { x: 0, y: height - 100 },
      end: { x: width, y: height - 100 },
      thickness: 4,
      color: colorGold,
    });

    const headerTextX = 40;

    // Nombre de marca
    page.drawText('GELABERT HOMES', {
      x: headerTextX,
      y: height - 48,
      size: 20,
      font: fontHelveticaBold,
      color: colorGold,
    });

    page.drawText('ESTUDIO DE SOLVENCIA Y PERFIL RESIDENCIAL', {
      x: headerTextX,
      y: height - 68,
      size: 10,
      font: fontHelvetica,
      color: rgb(250 / 255, 248 / 255, 245 / 255),
    });

    // Fecha del informe
    const reportDateStr = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    page.drawText(`Fecha del Informe: ${reportDateStr}`, {
      x: width - 200,
      y: height - 55,
      size: 9,
      font: fontHelvetica,
      color: rgb(200 / 255, 200 / 255, 200 / 255),
    });

    let currentY = height - 140;

    // RESUMEN FINANCIERO Y DE ESFUERZO CON DYNAMIC EXCHANGE RATES
    const FALLBACK_RATES: Record<string, number> = {
      EUR: 1,
      BRL: 6.0,
      USD: 1.08,
      GBP: 0.85
    };
    let rates = FALLBACK_RATES;
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR', { 
        signal: AbortSignal.timeout(4000) 
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          rates = { ...FALLBACK_RATES, ...data.rates };
        }
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
    }

    const getIncomeInEur = (income: number, currency?: string | null) => {
      const cleanCurrency = (currency || 'EUR').toUpperCase();
      const rate = rates[cleanCurrency] || FALLBACK_RATES[cleanCurrency] || 1;
      return income / rate;
    };

    const formatTenantIncome = (income: number, currency?: string | null) => {
      const cleanCurrency = (currency || 'EUR').toUpperCase();
      const rate = rates[cleanCurrency] || FALLBACK_RATES[cleanCurrency] || 1;
      const incomeInEur = income / rate;

      const eurString = incomeInEur.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

      if (cleanCurrency === 'EUR') {
        return eurString;
      }

      let localSymbol = cleanCurrency;
      if (cleanCurrency === 'BRL') localSymbol = 'R$';
      else if (cleanCurrency === 'USD') localSymbol = '$';
      else if (cleanCurrency === 'GBP') localSymbol = '£';

      const localAmountString = income.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${localAmountString} ${localSymbol} (${eurString})`;
    };

    const totalIncome = allTenants.reduce((acc, t) => {
      const tIncome = Number(t.monthly_income || 0);
      const tCurrency = t.currency || 'EUR';
      return acc + getIncomeInEur(tIncome, tCurrency);
    }, 0);

    const effortRate = totalIncome > 0 && rentPrice > 0 ? (rentPrice / totalIncome) * 100 : 0;

    // Determinar nivel de riesgo y recomendación
    let riskColor = colorGreen;
    let riskLabel = 'Riesgo Bajo (Solvente)';
    if (effortRate > 40) {
      riskColor = colorRed;
      riskLabel = 'Riesgo Alto (Supera 40% de ingresos)';
    } else if (effortRate > 30) {
      riskColor = colorYellow;
      riskLabel = 'Riesgo Moderado (Esfuerzo 30-40%)';
    }

    // Dibujar caja de resumen financiero
    page.drawRectangle({
      x: 40,
      y: currentY - 70,
      width: width - 80,
      height: 70,
      color: rgb(250 / 255, 248 / 255, 245 / 255),
      borderColor: colorLightGrey,
      borderWidth: 1,
    });

    // Textos financieros
    page.drawText('RESUMEN DE SOLVENCIA DEL GRUPO', {
      x: 55,
      y: currentY - 20,
      size: 10,
      font: fontHelveticaBold,
      color: colorCharcoal,
    });

    page.drawText(`Ingresos Mensuales Conjuntos: ${totalIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, {
      x: 55,
      y: currentY - 38,
      size: 9,
      font: fontHelvetica,
      color: colorCharcoal,
    });

    if (rentPrice > 0) {
      page.drawText(`Renta de Alquiler Propuesta: ${rentPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}  |  Tasa de Esfuerzo: ${effortRate.toFixed(1)}%`, {
        x: 55,
        y: currentY - 52,
        size: 9,
        font: fontHelvetica,
        color: colorCharcoal,
      });

      // Indicador de riesgo
      page.drawRectangle({
        x: width - 230,
        y: currentY - 48,
        width: 175,
        height: 25,
        color: riskColor,
      });

      page.drawText(riskLabel, {
        x: width - 220,
        y: currentY - 38,
        size: 8,
        font: fontHelveticaBold,
        color: rgb(255 / 255, 255 / 255, 255 / 255),
      });
    } else {
      page.drawText('Renta propuesta: No especificada', {
        x: 55,
        y: currentY - 52,
        size: 9,
        font: fontHelvetica,
        color: colorGrey,
      });
    }

    currentY -= 90;

    // ITERAR POR INQUILINOS Y DIBUJAR SUS PERFILES
    currentPage.drawText('PERFILES DE LOS INQUILINOS', {
      x: 40,
      y: currentY,
      size: 12,
      font: fontHelveticaBold,
      color: colorGold,
    });

    currentPage.drawLine({
      start: { x: 40, y: currentY - 5 },
      end: { x: width - 40, y: currentY - 5 },
      thickness: 1,
      color: colorGold,
    });

    currentY -= 25;

    for (let i = 0; i < allTenants.length; i++) {
      const tenant = allTenants[i];
      const isPrimary = !tenant.parent_tenant_id;
      const roleLabel = tenant.tenant_type === 'avalista' ? 'Avalista' : 'Titular';

      // Espacio para la tarjeta de perfil
      if (currentY - 110 < 55) {
        currentPage = createNewPage();
        currentY = height - 80;
      }

      // Dibujar caja de perfil del inquilino
      currentPage.drawRectangle({
        x: 40,
        y: currentY - 100,
        width: width - 80,
        height: 100,
        color: rgb(1, 1, 1),
        borderColor: colorLightGrey,
        borderWidth: 1,
      });

      // Título del Inquilino
      currentPage.drawText(`${tenant.first_name} ${tenant.last_name} (${roleLabel})`, {
        x: 50,
        y: currentY - 18,
        size: 10,
        font: fontHelveticaBold,
        color: colorCharcoal,
      });

      // Datos personales
      const personalDetails = [
        tenant.dni ? `DNI/NIE: ${tenant.dni}` : 'DNI/NIE: No aportado',
        tenant.age ? `Edad: ${tenant.age} años` : null,
        tenant.nationality ? `Nac.: ${tenant.nationality}` : null
      ].filter(Boolean).join('  |  ');

      currentPage.drawText(personalDetails, {
        x: 50,
        y: currentY - 34,
        size: 8.5,
        font: fontHelvetica,
        color: colorGrey,
      });


      const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'No especificada';
        try {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return dateStr;
        } catch {
          return dateStr;
        }
      };

      // Datos laborales/solvencia
      currentPage.drawText(`Situación Laboral: ${tenant.employment_status || 'No especificada'}`, {
        x: 280,
        y: currentY - 30,
        size: 8.5,
        font: fontHelvetica,
        color: colorCharcoal,
      });
      currentPage.drawText(`Empresa: ${tenant.company_name || 'No especificada'}`, {
        x: 280,
        y: currentY - 41,
        size: 8.5,
        font: fontHelvetica,
        color: colorCharcoal,
      });
      currentPage.drawText(`Tipo de Contrato: ${tenant.contract_type || 'No especificado'}`, {
        x: 280,
        y: currentY - 52,
        size: 8.5,
        font: fontHelvetica,
        color: colorCharcoal,
      });
      currentPage.drawText(`Antigüedad Laboral: ${formatDate(tenant.seniority_date)}`, {
        x: 280,
        y: currentY - 63,
        size: 8.5,
        font: fontHelvetica,
        color: colorCharcoal,
      });
      currentPage.drawText(`Ingresos Declarados: ${formatTenantIncome(Number(tenant.monthly_income || 0), tenant.currency)} / mes`, {
        x: 280,
        y: currentY - 75,
        size: 9,
        font: fontHelveticaBold,
        color: colorGold,
      });

      // Checklist de documentos de este inquilino específico
      const myDocs = docs ? docs.filter(d => d.tenant_id === tenant.id) : [];
      const docLabels = myDocs.map(d => {
        if (d.document_type === 'dni') return 'DNI Verificado';
        if (d.document_type === 'nomina') return 'Nómina aportada';
        if (d.document_type === 'contrato_trabajo') return 'Contrato Laboral aportado';
        if (d.document_type === 'declaracion_renta') return 'IRPF/Renta aportado';
        return d.file_name;
      });

      currentPage.drawText(`Docs: ${docLabels.length > 0 ? docLabels.join(', ') : 'Ninguno aportado'}`, {
        x: 50,
        y: currentY - 88,
        size: 7.5,
        font: fontHelvetica,
        color: colorGrey,
      });

      currentY -= 115;
    }

    // ANÁLISIS DE LA IA / COMENTARIOS DE SOLVENCIA CONSOLIDADOS
    const hasNotes = allTenants.some(t => t.ai_analysis_notes || t.notes);
    if (hasNotes) {
      if (currentY - 30 < 55) {
        currentPage = createNewPage();
        currentY = height - 80;
      }

      currentPage.drawText('VALORACIÓN DEL AGENTE Y ANÁLISIS DE IA', {
        x: 40,
        y: currentY,
        size: 11,
        font: fontHelveticaBold,
        color: colorGold,
      });

      currentPage.drawLine({
        start: { x: 40, y: currentY - 5 },
        end: { x: width - 40, y: currentY - 5 },
        thickness: 1,
        color: colorGold,
      });

      currentY -= 20;

      for (const tenant of allTenants) {
        if (tenant.ai_analysis_notes || tenant.notes) {
          const label = tenant.tenant_type === 'avalista' ? 'Avalista' : 'Titular';
          const title = `Valoración de ${tenant.first_name} ${tenant.last_name} (${label})`;
          
          let combinedNotes = '';
          if (tenant.notes && tenant.ai_analysis_notes) {
            combinedNotes = `Notas del Agente:\n${tenant.notes}\n\nAnálisis de la IA:\n${tenant.ai_analysis_notes}`;
          } else {
            combinedNotes = tenant.ai_analysis_notes || tenant.notes || '';
          }

          drawParagraph(combinedNotes, title);
        }
      }
    }

    // PIE DE PÁGINA CORPORATIVO (En primera página)
    page.drawText('Gelabert Homes — www.gelaberthomes.es', {
      x: 40,
      y: 30,
      size: 8,
      font: fontHelvetica,
      color: colorGrey,
    });

    page.drawText('Este informe es confidencial y para uso exclusivo del propietario y de la agencia inmobiliaria.', {
      x: width - 390,
      y: 30,
      size: 7.5,
      font: fontHelvetica,
      color: colorGrey,
    });

    // Guardar e importar PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const reportPath = `${tenantId}/estudio_solvencia_${tenantId}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from('tenant-docs')
      .upload(reportPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      throw uploadErr;
    }

    // Obtener URL firmada
    const { data: urlData } = await supabase.storage
      .from('tenant-docs')
      .createSignedUrl(reportPath, 60 * 60 * 24 * 365);

    const fileUrl = urlData?.signedUrl ?? '';

    return NextResponse.json({
      success: true,
      filePath: reportPath,
      fileUrl,
      fileName: `estudio_solvencia_${tenantId}.pdf`,
    });

  } catch (err: any) {
    console.error('Error en generate-solvency-report:', err);
    return NextResponse.json({ error: err.message || 'Error interno al generar reporte de solvencia' }, { status: 500 });
  }
}
