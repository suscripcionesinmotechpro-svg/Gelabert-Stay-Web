import { useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTenant, useTenantMutations } from '../../hooks/useTenants';
import { useContracts, useContractMutations } from '../../hooks/useContracts';
import { useTenantDocuments, uploadTenantDocument, deleteTenantDocument, getSignedDocUrl } from '../../hooks/useTenantDocuments';
import {
  ArrowLeft, Edit3, PlusCircle, Trash2, FileText, Upload,
  ExternalLink, Loader2, AlertTriangle, Home, Phone,
  Mail, MapPin, BadgeCheck, Users
} from 'lucide-react';
import {
  DOCUMENT_TYPE_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS,
  daysUntilExpiry
} from '../../types/tenant';
import type { DocumentType } from '../../types/tenant';

const TENANT_DOC_TYPES: DocumentType[] = [
  'dni', 'contrato_arrendamiento', 'documento_reserva', 'encargo_servicios', 'ficha_visita', 'otro'
];

const OWNER_DOC_TYPES: DocumentType[] = [
  'dni', 'nota_simple', 'factura_electricidad', 'factura_agua', 'factura_wifi', 'recibo_ibi', 'recibo_comunidad', 'otro'
];

export const AdminTenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant, loading: loadingTenant } = useTenant(id);
  const { deleteTenant } = useTenantMutations();
  const { contracts, loading: loadingContracts, refetch: refetchContracts } = useContracts(id);
  const { deleteContract } = useContractMutations();

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const activeContract = contracts.find(c => c.status === 'active') || contracts[0] || null;
  const displayContract = contracts.find(c => c.id === selectedContractId) || activeContract;

  const { documents, loading: loadingDocs, refetch: refetchDocs } = useTenantDocuments(displayContract?.id);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [pendingDocType, setPendingDocType] = useState<{ type: DocumentType, category: 'tenant' | 'owner' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteTenant = async () => {
    if (!confirm(`¿Eliminar a ${tenant?.first_name} ${tenant?.last_name}? Esta acción no se puede deshacer.`)) return;
    try { await deleteTenant(id!); navigate('/admin/inquilinos'); }
    catch (e: any) { setError(e.message); }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('¿Eliminar este contrato y todos sus documentos asociados?')) return;
    try { await deleteContract(contractId); refetchContracts(); }
    catch (e: any) { setError(e.message); }
  };

  const triggerUpload = (docType: DocumentType, category: 'tenant' | 'owner') => {
    setPendingDocType({ type: docType, category });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocType || !displayContract?.id) return;
    setUploadingType(pendingDocType.type);
    try {
      await uploadTenantDocument(displayContract.id, file, pendingDocType.type, pendingDocType.category);
      await refetchDocs();
    } catch (err: any) { setError(err.message); }
    finally { setUploadingType(null); setPendingDocType(null); e.target.value = ''; }
  };

  // ... (handleDownload, handleDeleteDoc, loading/null checks remain the same) ...
  // [Skipping lines 69-105 for brevity in this manual-like view, but they will be preserved]

  const handleDownload = async (docId: string, filePath: string, url: string, name: string) => {
    setDownloading(docId);
    try {
      const freshUrl = await getSignedDocUrl(filePath);
      const a = document.createElement('a');
      a.href = freshUrl || url;
      a.download = name;
      a.target = '_blank';
      a.click();
    } finally { setDownloading(null); }
  };

  const handleDeleteDoc = async (docId: string, filePath: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await deleteTenantDocument(docId, filePath); await refetchDocs(); }
    catch (err: any) { setError(err.message); }
  };

  if (loadingTenant) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-[#444]">
        <p className="font-primary text-sm">Inquilino no encontrado.</p>
        <Link to="/admin/inquilinos" className="text-[#C9A962] text-sm hover:underline">Volver</Link>
      </div>
    );
  }

  const expiryDays = displayContract?.status === 'active' ? daysUntilExpiry(displayContract.end_date) : null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/inquilinos')} className="text-[#666] hover:text-[#FAF8F5] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-[#0A0A0A] font-primary flex-shrink-0"
            style={{ backgroundColor: tenant.avatar_color || '#C9A962' }}
          >
            {tenant.first_name[0]}{tenant.last_name[0]}
          </div>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">{tenant.first_name} {tenant.last_name}</h1>
            {tenant.dni && <p className="font-primary text-[#555] text-sm">DNI/NIE: {tenant.dni}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/inquilinos/${id}/editar`}
            className="flex items-center gap-2 px-4 py-2 border border-[#333] text-[#888] font-primary text-xs hover:text-[#FAF8F5] hover:border-[#555] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </Link>
          <button
            onClick={handleDeleteTenant}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-500/60 font-primary text-xs hover:text-red-400 hover:border-red-500/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-primary text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Personal data */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-4">
            <p className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-semibold">Datos de Contacto</p>
            {tenant.email && (
              <div className="flex items-start gap-2"><Mail className="w-4 h-4 text-[#C9A962] flex-shrink-0 mt-0.5" />
                <div><p className="font-primary text-[10px] text-[#555]">Email</p><p className="font-primary text-sm text-[#FAF8F5]">{tenant.email}</p></div>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-[#C9A962] flex-shrink-0 mt-0.5" />
                <div><p className="font-primary text-[10px] text-[#555]">Teléfono</p><p className="font-primary text-sm text-[#FAF8F5]">{tenant.phone}</p></div>
              </div>
            )}
            {(tenant.address || tenant.city) && (
              <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[#C9A962] flex-shrink-0 mt-0.5" />
                <div><p className="font-primary text-[10px] text-[#555]">Dirección</p>
                  <p className="font-primary text-sm text-[#FAF8F5]">{[tenant.address, tenant.zip_code, tenant.city, tenant.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {tenant.dni && (
              <div className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#C9A962] flex-shrink-0 mt-0.5" />
                <div><p className="font-primary text-[10px] text-[#555]">DNI / NIE</p><p className="font-primary text-sm text-[#FAF8F5]">{tenant.dni}</p></div>
              </div>
            )}
          </div>

          {tenant.notes && (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5">
              <p className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-semibold mb-2">Notas</p>
              <p className="font-primary text-sm text-[#888] leading-relaxed">{tenant.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Contracts + Docs */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Contracts header */}
          <div className="flex items-center justify-between">
            <p className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-semibold">Contratos</p>
            <Link
              to={`/admin/contratos/nuevo?tenant_id=${id}`}
              className="flex items-center gap-1.5 text-[#C9A962] font-primary text-xs hover:text-[#D4B673] transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Nuevo contrato
            </Link>
          </div>

          {loadingContracts ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" /></div>
          ) : contracts.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-dashed border-[#2A2A2A] p-8 flex flex-col items-center gap-3 text-[#444]">
              <Home className="w-8 h-8" />
              <p className="font-primary text-sm">No hay contratos todavía</p>
              <Link to={`/admin/contratos/nuevo?tenant_id=${id}`}
                className="text-[#C9A962] text-xs hover:underline">Crear primer contrato</Link>
            </div>
          ) : (
            <>
              {/* Contract tabs if multiple (deduplicated by dates/property) */}
              {(() => {
                const uniqueContracts = Array.from(new Map(
                  contracts.map(c => [`${c.start_date}-${c.end_date}-${c.property_id}`, c])
                ).values());
                
                if (uniqueContracts.length <= 1) return null;
                
                return (
                  <div className="flex gap-2 flex-wrap">
                    {uniqueContracts.map(c => (
                      <button key={c.id}
                        onClick={() => setSelectedContractId(c.id)}
                        className={`font-primary text-xs px-3 py-1.5 border transition-colors ${displayContract?.id === c.id ? 'border-[#C9A962] text-[#C9A962]' : 'border-[#1F1F1F] text-[#666] hover:border-[#333] hover:text-[#FAF8F5]'}`}>
                        {new Date(c.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })} — {new Date(c.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {displayContract && (
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <span className={`self-start font-primary text-[10px] px-2.5 py-1 border rounded-full ${CONTRACT_STATUS_COLORS[displayContract.status]}`}>
                        {CONTRACT_STATUS_LABELS[displayContract.status]}
                      </span>
                      {displayContract.property_label && (
                        <div>
                          <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-1 flex items-center">
                            <Home className="w-3.5 h-3.5 mr-1.5 text-[#C9A962]" />
                            {displayContract.property_label}
                          </p>
                          {displayContract.room_id && (
                            <p className="font-primary text-xs text-[#C9A962] ml-5 mt-0.5">
                              — Alquiler de habitación
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/admin/contratos/${displayContract.id}/editar`}
                        className="text-[#666] hover:text-[#FAF8F5] p-1.5 border border-[#1F1F1F] hover:border-[#333] transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDeleteContract(displayContract.id)}
                        className="text-red-500/50 hover:text-red-400 p-1.5 border border-red-500/10 hover:border-red-500/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expiry alert */}
                  {expiryDays !== null && expiryDays <= 60 && (
                    <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs font-primary ${
                      expiryDays <= 30 ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {expiryDays <= 0 ? `Contrato expirado hace ${Math.abs(expiryDays)} días`
                        : `El contrato vence en ${expiryDays} días — actúa con tiempo`}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Inicio', value: new Date(displayContract.start_date).toLocaleDateString('es-ES') },
                      { label: 'Fin', value: new Date(displayContract.end_date).toLocaleDateString('es-ES') },
                      { label: 'Renta / mes', value: displayContract.monthly_rent ? `${displayContract.monthly_rent.toLocaleString('es-ES')} €` : '—' },
                      { label: 'Fianza', value: displayContract.deposit ? `${displayContract.deposit.toLocaleString('es-ES')} €` : '—' },
                      { label: 'Dirección EXACTA', value: displayContract.address || '—' },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="font-primary text-[10px] text-[#555] uppercase tracking-wider">{item.label}</p>
                        <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-0.5">{item.value}</p>
                      </div>
                    ))}
                    <div>
                      <p className="font-primary text-[#666] text-[11px] uppercase tracking-wider mb-1">Propiedad vinculada</p>
                      {displayContract.property_id ? (
                        <Link to={`/admin/propiedades/${displayContract.property_id}/editar`} className="font-primary text-sm text-[#C9A962] hover:underline font-semibold">
                          {displayContract.property_label || 'Propiedad'}
                        </Link>
                      ) : (
                        <p className="font-primary text-sm text-[#FAF8F5] font-semibold">{displayContract.property_label || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Landlord details */}
                  {(displayContract.landlord_name || displayContract.landlord_email || displayContract.landlord_phone) && (
                    <div className="border-t border-[#1F1F1F] pt-4 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="col-span-2 sm:col-span-4 mb-2">
                        <p className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-semibold">Datos del Propietario</p>
                      </div>
                      {displayContract.landlord_name && (
                        <div>
                          <p className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Nombre / DNI</p>
                          <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-0.5">
                            {displayContract.landlord_name}
                            {displayContract.landlord_dni && <span className="text-[#888] font-normal text-xs ml-1">({displayContract.landlord_dni})</span>}
                          </p>
                        </div>
                      )}
                      {displayContract.landlord_phone && (
                        <div>
                          <p className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Teléfono</p>
                          <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-0.5">{displayContract.landlord_phone}</p>
                        </div>
                      )}
                      {displayContract.landlord_email && (
                        <div className="col-span-2 sm:col-span-1">
                          <p className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Email</p>
                          <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-0.5 truncate" title={displayContract.landlord_email}>
                            {displayContract.landlord_email}
                          </p>
                        </div>
                      )}
                      {displayContract.landlord_address && (
                        <div className="col-span-2 sm:col-span-4 mt-1">
                          <p className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Dirección postal</p>
                          <p className="font-primary text-sm text-[#FAF8F5] font-semibold mt-0.5">{displayContract.landlord_address}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {displayContract.notes && (
                    <p className="font-primary text-sm text-[#666] border-t border-[#1A1A1A] pt-3">{displayContract.notes}</p>
                  )}

                  {/* Documents */}
                  <div className="border-t border-[#1A1A1A] pt-4 flex flex-col gap-6">
                    {/* Tenant Section */}
                    <div className="flex flex-col gap-3">
                      <p className="font-primary text-[10px] uppercase tracking-wider text-[#C9A962] font-semibold flex items-center gap-2">
                        <Users className="w-3 h-3" /> Documentación Inquilino
                      </p>
                      {loadingDocs ? (
                        <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" /></div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TENANT_DOC_TYPES.map(docType => {
                            const existing = documents.filter(d => d.document_type === docType && (d.category === 'tenant' || !d.category));
                            const isUploading = uploadingType === docType && pendingDocType?.category === 'tenant';
                            return (
                              <div key={docType} className="border border-[#1A1A1A] p-3 flex flex-col gap-2 bg-[#050505]">
                                <p className="font-primary text-xs text-[#888] font-semibold">{DOCUMENT_TYPE_LABELS[docType]}</p>
                                {existing.map(doc => (
                                  <div key={doc.id} className="flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 text-[#C9A962] flex-shrink-0" />
                                    <button
                                      onClick={() => handleDownload(doc.id, doc.file_path, doc.file_url, doc.file_name)}
                                      disabled={downloading === doc.id}
                                      className="font-primary text-[10px] text-[#666] hover:text-[#FAF8F5] truncate flex-1 text-left flex items-center gap-1 transition-colors"
                                    >
                                      {downloading === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />}
                                      {doc.file_name}
                                    </button>
                                    <button onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                                      className="text-[#333] hover:text-red-400 transition-colors flex-shrink-0">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => triggerUpload(docType, 'tenant')}
                                  disabled={isUploading}
                                  className="flex items-center gap-1 text-[#444] hover:text-[#C9A962] font-primary text-[10px] transition-colors disabled:opacity-50"
                                >
                                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                  {existing.length > 0 ? 'Añadir otro' : 'Subir PDF'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Landlord Section */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-[#121212]">
                      <p className="font-primary text-[10px] uppercase tracking-wider text-[#C9A962] font-semibold flex items-center gap-2">
                        <BadgeCheck className="w-3 h-3" /> Documentación Propietario
                      </p>
                      {loadingDocs ? (
                        <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" /></div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {OWNER_DOC_TYPES.map(docType => {
                            const existing = documents.filter(d => d.document_type === docType && d.category === 'owner');
                            const isUploading = uploadingType === docType && pendingDocType?.category === 'owner';
                            return (
                              <div key={docType} className="border border-[#1A1A1A] p-3 flex flex-col gap-2 bg-[#050505]">
                                <p className="font-primary text-xs text-[#888] font-semibold">{DOCUMENT_TYPE_LABELS[docType]}</p>
                                {existing.map(doc => (
                                  <div key={doc.id} className="flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 text-[#C9A962] flex-shrink-0" />
                                    <button
                                      onClick={() => handleDownload(doc.id, doc.file_path, doc.file_url, doc.file_name)}
                                      disabled={downloading === doc.id}
                                      className="font-primary text-[10px] text-[#666] hover:text-[#FAF8F5] truncate flex-1 text-left flex items-center gap-1 transition-colors"
                                    >
                                      {downloading === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />}
                                      {doc.file_name}
                                    </button>
                                    <button onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                                      className="text-[#333] hover:text-red-400 transition-colors flex-shrink-0">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => triggerUpload(docType, 'owner')}
                                  disabled={isUploading}
                                  className="flex items-center gap-1 text-[#444] hover:text-[#C9A962] font-primary text-[10px] transition-colors disabled:opacity-50"
                                >
                                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                  {existing.length > 0 ? 'Añadir otro' : 'Subir PDF'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
