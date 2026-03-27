import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TenantDocument, DocumentType, DocumentCategory } from '../types/tenant';

const BUCKET = 'tenant-docs';

// ─── LIST DOCS FOR A CONTRACT ─────────────────────────────────────────────────
export const useTenantDocuments = (contractId?: string) => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    if (!contractId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('tenant_documents')
      .select('*')
      .eq('contract_id', contractId)
      .order('uploaded_at', { ascending: false });
    setDocuments((data || []) as TenantDocument[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return { documents, loading, refetch: fetchDocs };
};

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
export const uploadTenantDocument = async (
  contractId: string,
  file: File,
  docType: DocumentType,
  category: DocumentCategory = 'tenant'
): Promise<TenantDocument> => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${contractId}/${timestamp}_${safeName}`;

  // Upload to storage
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  // Get signed URL (private bucket — 1 year expiry for practical purposes)
  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  const fileUrl = urlData?.signedUrl ?? '';

  // Insert DB record
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: inserted, error: dbErr } = await supabase
    .from('tenant_documents')
    .insert([{
      user_id: user.id,
      contract_id: contractId,
      document_type: docType,
      category,
      file_name: file.name,
      file_url: fileUrl,
      file_path: path,
    }])
    .select('*')
    .single();

  if (dbErr) throw dbErr;
  return inserted as TenantDocument;
};

// ─── GET FRESH SIGNED URL ─────────────────────────────────────────────────────
export const getSignedDocUrl = async (filePath: string): Promise<string> => {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1 hour
  return data?.signedUrl ?? '';
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteTenantDocument = async (id: string, filePath: string) => {
  // Remove from storage
  await supabase.storage.from(BUCKET).remove([filePath]);
  // Remove from DB
  const { error } = await supabase.from('tenant_documents').delete().eq('id', id);
  if (error) throw error;
};
