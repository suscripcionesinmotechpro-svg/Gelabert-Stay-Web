import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react';

interface ErrorDetailBoxProps {
  title: string;        // e.g. "Error al publicar en Idealista"
  error: string;        // Full error string
  details?: string;     // Optional extra context (stack, raw JSON, etc.)
  onClose?: () => void;
}

/**
 * Shows a styled error box as a MODAL overlay with the full error detail and a one-click copy button.
 * Designed for admin and agent panels so users can copy & paste errors easily.
 */
export const ErrorDetailBox = ({ title, error, details, onClose }: ErrorDetailBoxProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true); // Default to true so they see everything

  const fullText = [
    `=== ${title} ===`,
    `Fecha: ${new Date().toLocaleString('es-ES')}`,
    ``,
    `Error: ${error}`,
    details ? `\nDetalles:\n${details}` : '',
  ].filter(Boolean).join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = fullText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-red-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-red-500/20 bg-red-950/10">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="font-primary text-red-400 text-sm font-bold uppercase tracking-wider">
                {title}
              </h3>
              <p className="font-primary text-white/40 text-[10px] mt-0.5">
                {new Date().toLocaleString('es-ES')}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white transition-colors hover:bg-white/5 rounded"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Error Info */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto min-h-0">
          {/* Main error message */}
          <div className="flex flex-col gap-1.5">
            <span className="font-primary text-[10px] text-white/40 uppercase tracking-widest font-black">
              Mensaje de Error
            </span>
            <div className="w-full bg-[#050505] border border-[#1A1A1A] p-4 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs text-red-400/90 rounded selection:bg-red-500/20 leading-relaxed">
              {error}
            </div>
          </div>

          {/* Technical Details */}
          {details && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-primary text-[10px] text-white/40 uppercase tracking-widest font-black">
                  Detalles Técnicos / Stack Trace
                </span>
                <button
                  type="button"
                  onClick={() => setExpanded(e => !e)}
                  className="font-primary text-[10px] text-[#C9A962] hover:underline uppercase tracking-wider"
                >
                  {expanded ? 'Ocultar Detalles' : 'Ver Detalles'}
                </button>
              </div>
              
              {expanded && (
                <pre className="w-full bg-[#050505] border border-[#1A1A1A] p-4 max-h-72 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px] text-red-400/60 rounded leading-relaxed selection:bg-red-500/20">
                  {details}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-4 bg-[#050505] border-t border-[#1F1F1F]">
          <span className="text-[10px] font-primary text-white/20 select-none">
            Gelabert Homes CRM
          </span>
          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border rounded transition-all font-primary ${
                copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
              }`}
              title="Copiar error al portapapeles"
            >
              {copied ? (
                <><Check className="w-4 h-4" /> ¡Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Error</>
              )}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-[#1F1F1F] bg-[#0A0A0A] hover:bg-[#151515] text-[#FAF8F5]/80 hover:text-white rounded transition-all font-primary"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ErrorDetailState {
  title: string;
  error: string;
  details?: string;
}

export const useErrorDetail = () => {
  const [errorDetail, setErrorDetail] = useState<ErrorDetailState | null>(null);

  const showError = (title: string, error: string, details?: string) => {
    setErrorDetail({ title, error, details });
  };

  const clearError = () => setErrorDetail(null);

  return { errorDetail, showError, clearError };
};
