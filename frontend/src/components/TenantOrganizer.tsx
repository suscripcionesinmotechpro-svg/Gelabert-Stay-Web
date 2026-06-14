import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Upload, FileText, User, Users, Trash2, Plus, ArrowLeft, 
  CheckCircle, Loader2, AlertCircle, RefreshCw, ChevronRight, File
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  errorMsg?: string;
  tempPath?: string;
  extractedData?: {
    document_type: string;
    confidence: number;
    extracted_data: {
      first_name: string | null;
      last_name: string | null;
      dni: string | null;
      employment_status: string | null;
      company_name: string | null;
      job_title: string | null;
      seniority_date: string | null;
      contract_type: string | null;
      monthly_income: number | null;
      annual_income: number | null;
      age: number | null;
      nationality: string | null;
      document_date: string | null;
      notes: string | null;
    };
  };
}

interface GroupedTenant {
  tempId: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  employmentStatus: string;
  companyName: string;
  jobTitle: string;
  seniorityDate: string;
  contractType: string;
  monthlyIncome: number;
  notes: string;
  age: number | null;
  nationality: string;
  tenantType: 'titular_principal' | 'titular' | 'avalista' | '';
  documents: {
    queueItemId: string;
    fileName: string;
    documentTypes: string[];
    tempPath: string;
  }[];
}

export const TenantOrganizer = ({ isAdmin }: { isAdmin: boolean }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [groupedTenants, setGroupedTenants] = useState<GroupedTenant[]>([]);
  const [unassignedDocs, setUnassignedDocs] = useState<{
    queueItemId: string;
    fileName: string;
    tempPath: string;
  }[]>([]);
  
  const [savedGroupId, setSavedGroupId] = useState<string | null>(null);
  const [savingToDb, setSavingToDb] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');

  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingUnified, setGeneratingUnified] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [unifiedUrl, setUnifiedUrl] = useState<string | null>(null);

  const basePath = isAdmin ? '/admin' : '/agente';

  // Handle file drops / selection
  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadQueueItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0
    }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const removeQueueItem = (id: string) => {
    setQueue(prev => prev.filter(x => x.id !== id));
  };

  // Upload and analyze in batches (concurrency of 3)
  const startProcessing = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);

    const pendingItems = queue.filter(x => x.status === 'pending' || x.status === 'error');
    
    // Batch processing helper
    const processBatch = async (items: UploadQueueItem[]) => {
      await Promise.all(items.map(async (item) => {
        try {
          // 1. Update status to uploading
          updateQueueItem(item.id, { status: 'uploading', progress: 20 });
          
          const timestamp = Date.now();
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const tempPath = `temp-analysis/${timestamp}_${safeName}`;
          
          // Upload to Supabase Storage
          const { error: uploadErr } = await supabase.storage
            .from('tenant-docs')
            .upload(tempPath, item.file, { upsert: true });

          if (uploadErr) throw uploadErr;

          updateQueueItem(item.id, { status: 'analyzing', progress: 60, tempPath });

          // Get Session token for RLS propagation
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';

          // 2. Call AI analyze API route
          const response = await fetch('/api/analyze-tenant-docs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ 
              filePaths: [tempPath],
              additionalNotes: batchNotes
            })
          });

          if (!response.ok) {
            const errRes = await response.json();
            throw new Error(errRes.error || 'Fallo en la clasificación de IA');
          }

          const analysisResult = await response.json();

          updateQueueItem(item.id, { 
            status: 'completed', 
            progress: 100, 
            extractedData: analysisResult 
          });

        } catch (err: any) {
          console.error(err);
          updateQueueItem(item.id, { 
            status: 'error', 
            progress: 0, 
            errorMsg: err.message || 'Error desconocido' 
          });
        }
      }));
    };

    // Process in chunks of 3
    const chunkSize = 3;
    for (let i = 0; i < pendingItems.length; i += chunkSize) {
      const chunk = pendingItems.slice(i, i + chunkSize);
      await processBatch(chunk);
    }

    setIsProcessing(false);
    organizeDocuments();
  };

  const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Group analyzed documents by detected person name
  const organizeDocuments = () => {
    const tenantsMap: Record<string, GroupedTenant> = {};
    const unassigned: typeof unassignedDocs = [];

    // Fetch the updated queue items
    setQueue(prevQueue => {
      prevQueue.forEach(item => {
        if (item.status !== 'completed' || !item.extractedData) {
          if (item.tempPath) {
            unassigned.push({
              queueItemId: item.id,
              fileName: item.file.name,
              tempPath: item.tempPath
            });
          }
          return;
        }

        const data = item.extractedData.extracted_data;
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        
        // If we can't extract a name, keep it unassigned
        if (!firstName && !lastName) {
          if (item.tempPath) {
            unassigned.push({
              queueItemId: item.id,
              fileName: item.file.name,
              tempPath: item.tempPath
            });
          }
          return;
        }

        const fullNameKey = `${firstName} ${lastName}`.trim().toLowerCase();

        if (!tenantsMap[fullNameKey]) {
          tenantsMap[fullNameKey] = {
            tempId: Math.random().toString(36).substring(7),
            firstName: firstName || 'Inquilino',
            lastName: lastName || 'Nuevo',
            dni: data.dni || '',
            email: '',
            phone: '',
            employmentStatus: data.employment_status || 'empleado',
            companyName: data.company_name || '',
            jobTitle: data.job_title || '',
            seniorityDate: data.seniority_date || '',
            contractType: data.contract_type || 'indefinido',
            monthlyIncome: data.monthly_income || 0,
            notes: data.notes || '',
            age: data.age || null,
            nationality: data.nationality || '',
            tenantType: '',
            documents: []
          };
        }

        if (item.tempPath) {
          const detectedTypes = item.extractedData?.document_types || 
                               (item.extractedData?.document_type ? [item.extractedData.document_type] : ['otro']);
          tenantsMap[fullNameKey].documents.push({
            queueItemId: item.id,
            fileName: item.file.name,
            documentTypes: detectedTypes,
            tempPath: item.tempPath
          });
        }
      });

      setGroupedTenants(Object.values(tenantsMap));
      setUnassignedDocs(unassigned);
      return prevQueue;
    });
  };

  // Manual edits
  const handleTenantFieldChange = (index: number, key: keyof GroupedTenant, value: any) => {
    setGroupedTenants(prev => prev.map((t, idx) => idx === index ? { ...t, [key]: value } : t));
  };

  const handleToggleDocType = (tenantIdx: number, docIdx: number, typeValue: string) => {
    setGroupedTenants(prev => prev.map((t, idx) => {
      if (idx !== tenantIdx) return t;
      const docs = t.documents.map((d, dIdx) => {
        if (dIdx !== docIdx) return d;
        const currentTypes = d.documentTypes || [];
        const newTypes = currentTypes.includes(typeValue)
          ? currentTypes.filter(x => x !== typeValue)
          : [...currentTypes, typeValue];
        
        // Al menos un tipo debe estar seleccionado
        return { ...d, documentTypes: newTypes.length > 0 ? newTypes : [typeValue] };
      });
      return { ...t, documents: docs };
    }));
  };

  const removeDocFromTenant = (tenantIdx: number, docIdx: number) => {
    const doc = groupedTenants[tenantIdx].documents[docIdx];
    setUnassignedDocs(prev => [...prev, {
      queueItemId: doc.queueItemId,
      fileName: doc.fileName,
      tempPath: doc.tempPath
    }]);
    setGroupedTenants(prev => prev.map((t, idx) => {
      if (idx !== tenantIdx) return t;
      return { ...t, documents: t.documents.filter((_, dIdx) => dIdx !== docIdx) };
    }));
  };

  const addDocToTenant = (tenantIdx: number, unassignedIdx: number) => {
    const doc = unassignedDocs[unassignedIdx];
    setGroupedTenants(prev => prev.map((t, idx) => {
      if (idx !== tenantIdx) return t;
      return {
        ...t,
        documents: [...t.documents, {
          queueItemId: doc.queueItemId,
          fileName: doc.fileName,
          documentTypes: ['otro'],
          tempPath: doc.tempPath
        }]
      };
    }));
    setUnassignedDocs(prev => prev.filter((_, idx) => idx !== unassignedIdx));
  };

  const addNewTenantCard = () => {
    const newT: GroupedTenant = {
      tempId: Math.random().toString(36).substring(7),
      firstName: 'Nuevo',
      lastName: 'Inquilino',
      dni: '',
      email: '',
      phone: '',
      employmentStatus: 'empleado',
      companyName: '',
      jobTitle: '',
      seniorityDate: '',
      contractType: 'indefinido',
      monthlyIncome: 0,
      notes: '',
      age: null,
      nationality: '',
      tenantType: '',
      documents: []
    };
    setGroupedTenants(prev => [...prev, newT]);
  };

  // Sync to Database
  const commitToDatabase = async () => {
    if (groupedTenants.length === 0) return;
    
    // Validar que todos tengan un rol seleccionado
    const hasUnselectedRole = groupedTenants.some(gt => !gt.tenantType);
    if (hasUnselectedRole) {
      toast.error('Por favor, selecciona el Rol en Contrato para todos los inquilinos.');
      return;
    }

    // Validar que haya exactamente un Titular Principal
    const principalCount = groupedTenants.filter(gt => gt.tenantType === 'titular_principal').length;
    if (principalCount === 0) {
      toast.error('Debes seleccionar exactamente un Titular Principal para el grupo de alquiler.');
      return;
    }
    if (principalCount > 1) {
      toast.error('Solo puede haber un Titular Principal en el grupo de alquiler.');
      return;
    }

    setSavingToDb(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      // Reordenar los inquilinos para que el Titular Principal quede en el índice 0
      const sortedTenants = [...groupedTenants];
      const principalIdx = sortedTenants.findIndex(gt => gt.tenantType === 'titular_principal');
      if (principalIdx > 0) {
        const [principalTenant] = sortedTenants.splice(principalIdx, 1);
        sortedTenants.unshift(principalTenant);
      }

      let primaryTenantId = '';
      const savedTenantIds: string[] = [];

      // Loop and save tenants
      for (let i = 0; i < sortedTenants.length; i++) {
        const gt = sortedTenants[i];
        
        // Define if it is a co-tenant (primary is the first card)
        const parentId = i === 0 ? null : primaryTenantId;

        const dbTenantType = gt.tenantType === 'titular_principal' ? 'titular' : gt.tenantType;

        const { data: insertedTenant, error: tErr } = await supabase
          .from('tenants')
          .insert([{
            user_id: user.id,
            agent_id: user.id,
            parent_tenant_id: parentId,
            first_name: gt.firstName,
            last_name: gt.lastName,
            dni: gt.dni || null,
            email: gt.email || null,
            phone: gt.phone || null,
            employment_status: gt.employmentStatus,
            company_name: gt.companyName || null,
            job_title: gt.jobTitle || null,
            seniority_date: gt.seniorityDate || null,
            contract_type: gt.contractType,
            monthly_income: gt.monthlyIncome || null,
            ai_analysis_notes: gt.notes || null,
            age: gt.age || null,
            nationality: gt.nationality || null,
            tenant_type: dbTenantType || 'titular'
          }])
          .select('id')
          .single();

        if (tErr || !insertedTenant) throw tErr || new Error('Fallo al crear inquilino');

        if (i === 0) {
          primaryTenantId = insertedTenant.id;
        }
        savedTenantIds.push(insertedTenant.id);

        // Move files from temp to final storage folder and save in DB
        for (const doc of gt.documents) {
          const finalPath = `${primaryTenantId}/${Date.now()}_${doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          
          // Move in Supabase Storage
          const { error: moveErr } = await supabase.storage
            .from('tenant-docs')
            .move(doc.tempPath, finalPath);

          if (moveErr) {
            console.error('Error moviendo archivo, probamos a copiar y borrar:', moveErr);
            // Fallback: download and re-upload (if move fails)
            continue;
          }

          // Get fresh signed URL for 1 year
          const { data: urlData } = await supabase.storage
            .from('tenant-docs')
            .createSignedUrl(finalPath, 60 * 60 * 24 * 365);

          const fileUrl = urlData?.signedUrl ?? '';

          // Insert a document row for each selected type
          const typesToSave = doc.documentTypes && doc.documentTypes.length > 0 ? doc.documentTypes : ['otro'];
          for (const type of typesToSave) {
            const { error: docErr } = await supabase
              .from('tenant_documents')
              .insert([{
                user_id: user.id,
                tenant_id: insertedTenant.id,
                document_type: type,
                file_name: doc.fileName,
                file_path: finalPath,
                file_url: fileUrl,
                category: 'tenant'
              }]);

            if (docErr) console.error('Error insertando registro de documento:', docErr);
          }
        }
      }

      toast.success('Inquilinos y documentos guardados con éxito');
      setSavedGroupId(primaryTenantId);

    } catch (err: any) {
      console.error(err);
      toast.error(`Error guardando expediente: ${err.message}`);
    } finally {
      setSavingToDb(false);
    }
  };

  // Call API for Ficha de Solvencia PDF
  const generateSolvencyReport = async () => {
    if (!savedGroupId) return;
    setGeneratingReport(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/generate-solvency-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          tenantId: savedGroupId,
          monthlyRent: monthlyRent ? Number(monthlyRent) : 0
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      const res = await response.json();
      setReportUrl(res.fileUrl);
      toast.success('Ficha de Solvencia generada');

      // Save solvency report pdf in documents
      await supabase.from('tenant_documents').insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        tenant_id: savedGroupId,
        document_type: 'otro',
        file_name: res.fileName,
        file_path: res.filePath,
        file_url: res.fileUrl,
        category: 'tenant'
      }]);

    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Call API for Compiled Unified PDF
  const generateUnifiedPdf = async () => {
    if (!savedGroupId) return;
    setGeneratingUnified(true);
    try {
      // Fetch all documents for this tenant group using the parent_tenant_id linked records
      const { data: linkedTenants } = await supabase
        .from('tenants')
        .select('id')
        .or(`id.eq.${savedGroupId},parent_tenant_id.eq.${savedGroupId}`);

      const savedIds = linkedTenants?.map(t => t.id) || [savedGroupId];

      const { data: finalDocs } = await supabase
        .from('tenant_documents')
        .select('file_path')
        .in('tenant_id', savedIds);

      const paths = finalDocs?.map(d => d.file_path) || [];

      if (paths.length === 0) {
        throw new Error('No hay documentos para unificar');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/compile-tenant-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          contractId: 'general_docs', // fallback directory name
          tenantId: savedGroupId,
          filePaths: paths
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      const res = await response.json();
      setUnifiedUrl(res.fileUrl);
      toast.success('Expediente unificado generado');

      // Save compiled pdf in documents
      await supabase.from('tenant_documents').insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        tenant_id: savedGroupId,
        document_type: 'otro',
        file_name: res.fileName,
        file_path: res.filePath,
        file_url: res.fileUrl,
        category: 'tenant'
      }]);

    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setGeneratingUnified(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`${basePath}/inquilinos`)} 
          className="text-[#666] hover:text-[#FAF8F5] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Organizador Inteligente de Lotes</h1>
          <p className="font-primary text-[#666] text-sm mt-0.5">
            Sube múltiples archivos para agruparlos por persona y extraer sus datos de solvencia.
          </p>
        </div>
      </div>

      {!savedGroupId ? (
        <>
          {/* UPLOAD ZONE */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962]/50 bg-[#0A0A0A] p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
          >
            <Upload className="w-8 h-8 text-[#666] group-hover:text-[#C9A962] transition-colors" />
            <p className="font-primary text-sm text-[#FAF8F5] font-semibold">
              Arrastra tus archivos aquí o haz clic para buscarlos
            </p>
            <p className="font-primary text-xs text-[#555]">
              Soporta PDFs e imágenes (JPEG, PNG). Sube múltiples nóminas, DNIs y contratos en bloque.
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleFilesAdded(e.target.files)} 
            />
          </div>

          {/* ADDITIONAL NOTES / GENERAL PROFILE */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-3">
            <label htmlFor="batch-notes" className="font-primary font-bold text-xs uppercase tracking-wider text-[#C9A962]">
              Notas del agente / Perfil general de los inquilinos
            </label>
            <p className="font-primary text-[#666] text-xs">
              Introduce o pega datos relevantes de los inquilinos (por ejemplo, perfiles generales por separado, notas de contacto, aclaraciones) para que la IA los combine con la documentación y mejore el análisis de solvencia.
            </p>
            <textarea
              id="batch-notes"
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder={`Ejemplo:
- Inquilino 1: Juan López, 35 años, nacionalidad española. Autónomo con ingresos de unos 3000€/mes.
- Inquilino 2: María López (avalista), madre de Juan, pensionista con 1500€/mes de pensión.`}
              rows={4}
              className="w-full bg-black border border-[#1F1F1F] text-[#FAF8F5] p-3 text-sm focus:outline-none focus:border-[#C9A962] transition-colors placeholder-[#444] font-primary resize-y"
            />
          </div>

          {/* QUEUE & PROGRESS */}
          {queue.length > 0 && (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">
                  Cola de procesamiento ({queue.length} archivos)
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={startProcessing}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {isProcessing ? 'Analizando...' : 'Iniciar Análisis'}
                  </button>
                  <button 
                    onClick={() => setQueue([])}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-[#1F1F1F] text-[#888] font-primary font-bold text-xs uppercase tracking-wider hover:text-red-400 hover:border-red-400/20 transition-all disabled:opacity-50"
                  >
                    Limpiar Cola
                  </button>
                </div>
              </div>

              {/* Progress items */}
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-2">
                {queue.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-black/40 border border-[#111] px-4 py-3 rounded-sm">
                    <div className="flex items-center gap-3 truncate mr-4">
                      <FileText className="w-4 h-4 text-[#C9A962] flex-shrink-0" />
                      <span className="font-primary text-sm text-[#FAF8F5] truncate">{item.file.name}</span>
                      <span className="font-primary text-[10px] text-[#555]">({(item.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.status === 'pending' && <span className="font-primary text-[10px] uppercase text-[#666] tracking-wider">Pendiente</span>}
                      {item.status === 'uploading' && <span className="font-primary text-[10px] uppercase text-[#C9A962] tracking-wider animate-pulse">Subiendo...</span>}
                      {item.status === 'analyzing' && <span className="font-primary text-[10px] uppercase text-yellow-400 tracking-wider animate-pulse">Analizando (IA)...</span>}
                      {item.status === 'completed' && <span className="font-primary text-[10px] uppercase text-green-400 tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Listo</span>}
                      {item.status === 'error' && (
                        <span className="font-primary text-[10px] uppercase text-red-400 tracking-wider flex items-center gap-1" title={item.errorMsg}>
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                      
                      {item.status !== 'completed' && item.status !== 'error' && (
                        <div className="w-16 bg-[#111] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#C9A962] h-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}

                      <button 
                        onClick={() => removeQueueItem(item.id)}
                        disabled={isProcessing}
                        className="text-[#444] hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLASSIFIED RESULTS SECTION */}
          {groupedTenants.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                <h2 className="font-primary font-bold text-lg text-[#FAF8F5] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C9A962]" /> Expedientes de Inquilinos Detectados
                </h2>
                <button 
                  onClick={addNewTenantCard}
                  className="flex items-center gap-1 text-xs text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Inquilino Manualmente
                </button>
              </div>

              {/* Grid of tenants */}
              <div className="grid grid-cols-1 gap-6">
                {groupedTenants.map((tenant, tenantIdx) => (
                  <div key={tenant.tempId} className="bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962]/40 transition-all p-6 flex flex-col gap-6">
                    {/* Header: Title / Name */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 p-4 border border-[#111] rounded-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A962]/10 border border-[#C9A962]/30 flex items-center justify-center text-[#C9A962]">
                          {tenant.tenantType === 'titular_principal' ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-primary text-[10px] uppercase tracking-widest text-[#666] font-bold">
                            {tenant.tenantType === 'titular_principal' ? 'Titular Principal' : tenant.tenantType === 'avalista' ? 'Avalista' : tenant.tenantType === 'titular' ? 'Titular' : `Persona #${tenantIdx + 1}`}
                          </p>
                          <h3 className="font-primary text-md text-[#FAF8F5] font-semibold">
                            {tenant.firstName} {tenant.lastName || ''}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Editable fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Nombre *</label>
                        <input 
                          type="text" 
                          value={tenant.firstName}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'firstName', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Apellidos</label>
                        <input 
                          type="text" 
                          value={tenant.lastName}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'lastName', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">DNI / NIE / Pasaporte</label>
                        <input 
                          type="text" 
                          value={tenant.dni}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'dni', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Edad</label>
                        <input 
                          type="number" 
                          value={tenant.age ?? ''}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'age', e.target.value ? Number(e.target.value) : null)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Nacionalidad</label>
                        <input 
                          type="text" 
                          value={tenant.nationality}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'nationality', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Rol en Contrato *</label>
                        <select
                          value={tenant.tenantType || ''}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'tenantType', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="titular_principal">Titular Principal</option>
                          <option value="titular">Titular</option>
                          <option value="avalista">Avalista</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Email</label>
                        <input 
                          type="email" 
                          value={tenant.email}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'email', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Teléfono</label>
                        <input 
                          type="text" 
                          value={tenant.phone}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'phone', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Ingresos Mensuales Netos (€)</label>
                        <input 
                          type="number" 
                          value={tenant.monthlyIncome}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'monthlyIncome', Number(e.target.value))}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Situación Laboral</label>
                        <select 
                          value={tenant.employmentStatus}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'employmentStatus', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors cursor-pointer"
                        >
                          <option value="empleado">Cuenta Ajena (Empleado)</option>
                          <option value="autónomo">Cuenta Propia (Autónomo)</option>
                          <option value="estudiante">Estudiante</option>
                          <option value="pensionista">Pensionista</option>
                          <option value="desempleado">Desempleado</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Empresa / Empleador</label>
                        <input 
                          type="text" 
                          value={tenant.companyName}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'companyName', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Tipo de Contrato</label>
                        <select 
                          value={tenant.contractType}
                          onChange={(e) => handleTenantFieldChange(tenantIdx, 'contractType', e.target.value)}
                          className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors cursor-pointer"
                        >
                          <option value="indefinido">Indefinido</option>
                          <option value="temporal">Temporal</option>
                          <option value="prácticas">Prácticas / Formación</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>

                    {/* Extracted internal summary */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-primary text-[10px] uppercase tracking-wider text-[#555]">Notas de Análisis (IA)</label>
                      <textarea 
                        value={tenant.notes}
                        rows={2}
                        onChange={(e) => handleTenantFieldChange(tenantIdx, 'notes', e.target.value)}
                        className="bg-black border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors resize-none"
                      />
                    </div>

                    {/* Associated documents */}
                    <div className="flex flex-col gap-3">
                      <h4 className="font-primary font-bold text-[10px] uppercase tracking-wider text-[#555] border-b border-[#1A1A1A] pb-1">
                        Documentación Asignada
                      </h4>
                      
                      {tenant.documents.length === 0 ? (
                        <p className="font-primary text-xs text-[#444] italic">Ningún documento asignado. Arrastra documentos abajo para asignarlos.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {tenant.documents.map((doc, docIdx) => (
                            <div key={doc.queueItemId} className="flex flex-wrap items-center justify-between bg-black/60 border border-[#1A1A1A] px-4 py-2.5 rounded-sm">
                              <div className="flex items-center gap-2.5 truncate mr-4">
                                <File className="w-3.5 h-3.5 text-[#C9A962] flex-shrink-0" />
                                <span className="font-primary text-xs text-[#FAF8F5] truncate">{doc.fileName}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <span className="font-primary text-[9px] uppercase tracking-wider text-[#555] font-bold">Tipo de Documento (Selecciona varios si aplica):</span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { value: 'dni', label: 'DNI / NIE / Pas' },
                                      { value: 'nomina', label: 'Nómina' },
                                      { value: 'contrato_trabajo', label: 'Contrato' },
                                      { value: 'declaracion_renta', label: 'Renta' },
                                      { value: 'modelo_autonomo', label: 'Autónomo' },
                                      { value: 'otro', label: 'Otro' }
                                    ].map(type => {
                                      const isSelected = (doc.documentTypes || []).includes(type.value);
                                      return (
                                        <button
                                          key={type.value}
                                          type="button"
                                          onClick={() => handleToggleDocType(tenantIdx, docIdx, type.value)}
                                          className={`px-2 py-1 text-[9px] font-primary font-bold uppercase tracking-wider border transition-all ${
                                            isSelected 
                                              ? 'bg-[#C9A962] text-black border-[#C9A962]' 
                                              : 'bg-[#0A0A0A] text-[#888] border-[#1F1F1F] hover:border-[#FAF8F5]/30'
                                          }`}
                                        >
                                          {type.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeDocFromTenant(tenantIdx, docIdx)}
                                  className="text-[#444] hover:text-red-400 transition-colors"
                                  title="Quitar asignación"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unassigned Docs Box */}
              {unassignedDocs.length > 0 && (
                <div className="bg-[#0A0A0A] border border-red-500/10 p-5 flex flex-col gap-4">
                  <h3 className="font-primary font-bold text-xs uppercase tracking-wider text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Documentos sin asignar (No clasificados)
                  </h3>
                  <div className="flex flex-col gap-2">
                    {unassignedDocs.map((doc, docIdx) => (
                      <div key={doc.queueItemId} className="flex items-center justify-between bg-black/40 border border-[#1A1A1A] px-4 py-3">
                        <div className="flex items-center gap-2.5 truncate mr-4">
                          <File className="w-4 h-4 text-[#888]" />
                          <span className="font-primary text-xs text-[#FAF8F5] truncate">{doc.fileName}</span>
                        </div>
                        <div className="flex gap-2">
                          {groupedTenants.map((t, tIdx) => (
                            <button 
                              key={t.tempId}
                              onClick={() => addDocToTenant(tIdx, docIdx)}
                              className="px-2.5 py-1.5 bg-[#1F1F1F] text-[#FAF8F5] font-primary text-[10px] uppercase tracking-wider font-semibold rounded-sm hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all"
                            >
                              Asignar a {t.firstName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={commitToDatabase}
                  disabled={savingToDb}
                  className="flex items-center gap-2 px-6 py-3.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
                >
                  {savingToDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Guardar Expedientes en Base de Datos
                </button>
                <button
                  onClick={() => navigate(`${basePath}/inquilinos`)}
                  className="px-6 py-3.5 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:text-[#FAF8F5] hover:border-[#333] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* SAVED STATUS / DOWNLOADS STAGE */
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-8 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-secondary text-2xl text-[#FAF8F5]">Expedientes Guardados Correctamente</h2>
            <p className="font-primary text-[#666] text-sm mt-2 max-w-lg">
              Los inquilinos han sido creados en la base de datos de Supabase y sus documentos se han guardado de forma permanente.
            </p>
          </div>

          <div className="w-full max-w-md bg-black/40 p-6 border border-[#111] rounded-sm flex flex-col gap-4 text-left">
            <h3 className="font-primary font-bold text-xs uppercase tracking-wider text-[#C9A962] border-b border-[#111] pb-2">
              Generar Documentación para el Propietario
            </h3>

            {/* Rent input for Report */}
            <div className="flex flex-col gap-1.5">
              <label className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Renta de alquiler propuesta (€/mes)</label>
              <input 
                type="number" 
                placeholder="Ej. 900"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] placeholder-[#444]"
              />
            </div>

            {/* Generator buttons */}
            <div className="flex flex-col gap-3 mt-2">
              {/* Solvency report */}
              {reportUrl ? (
                <a 
                  href={reportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-primary font-bold uppercase tracking-wider hover:bg-green-500/20 transition-all"
                >
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Ficha de Solvencia (PDF)</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <button 
                  onClick={generateSolvencyReport}
                  disabled={generatingReport}
                  className="flex items-center justify-center gap-2 p-3 border border-[#C9A962]/40 text-[#C9A962] text-xs font-primary font-bold uppercase tracking-wider hover:bg-[#C9A962]/10 transition-all disabled:opacity-50"
                >
                  {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generar Ficha de Solvencia PDF
                </button>
              )}

              {/* Compiled unified documentation */}
              {unifiedUrl ? (
                <a 
                  href={unifiedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-primary font-bold uppercase tracking-wider hover:bg-green-500/20 transition-all"
                >
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Documentos Consolidados (PDF)</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <button 
                  onClick={generateUnifiedPdf}
                  disabled={generatingUnified}
                  className="flex items-center justify-center gap-2 p-3 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-primary font-bold uppercase tracking-wider hover:border-[#333] transition-all disabled:opacity-50"
                >
                  {generatingUnified ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Unificar toda la Documentación en un PDF
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => navigate(`${basePath}/inquilinos/${savedGroupId}`)}
              className="px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
            >
              Ver Ficha del Inquilino
            </button>
            <button 
              onClick={() => {
                // Reset state to start a new analysis
                setSavedGroupId(null);
                setQueue([]);
                setGroupedTenants([]);
                setUnassignedDocs([]);
                setReportUrl(null);
                setUnifiedUrl(null);
                setBatchNotes('');
              }}
              className="px-6 py-3 border border-[#1F1F1F] text-[#FAF8F5] font-primary text-sm hover:border-[#333] transition-colors"
            >
              Analizar otro lote
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
