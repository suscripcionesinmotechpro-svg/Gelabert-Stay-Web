import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface ErrorDetailBoxProps {
  title: string;        // e.g. "Error al publicar en Idealista"
  error: string;        // Full error string
  details?: string;     // Optional extra context (stack, raw JSON, etc.)
  onClose?: () => void;
}

/**
 * Shows a styled error box with the full error detail and a one-click copy button.
 * Designed for admin panels so users can copy & paste errors for support.
 */
export const ErrorDetailBox = ({ title, error, details, onClose }: ErrorDetailBoxProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    <div className="w-full border border-red-500/30 bg-red-500/5 rounded-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 p-3 border-b border-red-500/20">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-primary text-red-400 text-xs font-bold uppercase tracking-wide">
              {title}
            </p>
            <p className="font-primary text-red-300/80 text-xs mt-0.5 break-words">
              {error}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm transition-all font-primary ${
              copied
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
            title="Copiar error completo"
          >
            {copied ? (
              <><Check className="w-3 h-3" /> Copiado</>
            ) : (
              <><Copy className="w-3 h-3" /> Copiar</>
            )}
          </button>
          {/* Expand/collapse if there are details */}
          {details && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 text-red-400/60 hover:text-red-400 rounded-sm transition-all font-primary"
              title="Ver detalles técnicos"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Menos' : 'Más'}
            </button>
          )}
          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-red-400/40 hover:text-red-400 transition-colors text-lg leading-none"
              title="Cerrar"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Expandable technical details */}
      {details && expanded && (
        <div className="p-3 bg-black/30">
          <pre className="font-mono text-[10px] text-red-300/60 whitespace-pre-wrap break-all leading-relaxed">
            {details}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to manage a single error detail state.
 * Usage:
 *   const { errorDetail, showError, clearError } = useErrorDetail();
 *   ...
 *   showError('Error en Idealista', result.error, JSON.stringify(result, null, 2));
 *   ...
 *   {errorDetail && <ErrorDetailBox {...errorDetail} onClose={clearError} />}
 */
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
