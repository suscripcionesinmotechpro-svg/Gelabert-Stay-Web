import { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { useInvoices, useInvoiceSummary } from '../../hooks/useInvoices';
import { 
  Plus, Trash2, Check, X, TrendingUp, TrendingDown, 
  Wallet, Calculator, ArrowUpRight, Info
} from 'lucide-react';

const cardClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-4";
const inputClass = "w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";

export const AdminAccounting = () => {
  const [activeTab, setActiveTab] = useState<'balance' | 'fixed'>('balance');
  const [isAdding, setIsAdding] = useState(false);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [filters] = useState({
    startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
    endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`,
  });

  const { fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, loading: loadingFixed } = useAccounting();
  const { summary, loading: loadingSummary } = useInvoiceSummary(filters);
  const { invoices, loading: loadingInvoices } = useInvoices({ 
    startDate: filters.startDate, 
    endDate: filters.endDate 
  });

  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: 0,
    category: 'General',
    day_of_month: 1,
    is_active: true
  });

  const activeFixedExpensesTotal = fixedExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = summary.income || 0;
  const totalVariableExpenses = summary.expenses || 0;
  const grandTotalExpenses = totalVariableExpenses + activeFixedExpensesTotal;
  const netBalance = totalIncome - grandTotalExpenses;

  const handleSaveExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) return;
    await addFixedExpense(newExpense);
    setIsAdding(false);
    setNewExpense({ name: '', amount: 0, category: 'General', day_of_month: 1, is_active: true });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  if (loadingFixed || loadingSummary || loadingInvoices) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-secondary text-4xl text-[#FAF8F5]">Contabilidad</h1>
          <p className="font-primary text-[#666666] text-sm mt-2">
            Gestión de ingresos, gastos fijos y balance financiero mensual
          </p>
        </div>
        
        <div className="flex bg-[#0A0A0A] border border-[#1F1F1F] p-1 h-11 self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('balance')}
            className={`px-6 h-full font-primary text-xs uppercase tracking-widest font-bold transition-all ${
              activeTab === 'balance' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Balance Mensual
          </button>
          <button 
            onClick={() => setActiveTab('fixed')}
            className={`px-6 h-full font-primary text-xs uppercase tracking-widest font-bold transition-all ${
              activeTab === 'fixed' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Gastos Fijos
          </button>
        </div>
      </div>

      {activeTab === 'balance' ? (
        <>
          {/* Dashboard Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <span className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">Ingresos Facturados</span>
                <Wallet className="w-4 h-4 text-[#C9A962]" />
              </div>
              <p className="font-secondary text-3xl text-[#FAF8F5]">{formatCurrency(totalIncome)}</p>
              <div className="flex items-center gap-1 text-[10px] text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>Facturas emitidas este mes</span>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <span className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">Gastos Variables</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <p className="font-secondary text-3xl text-[#FAF8F5]">{formatCurrency(totalVariableExpenses)}</p>
              <div className="flex items-center gap-1 text-[10px] text-[#888888]">
                <span>Compras y reparaciones</span>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <span className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">Gastos Fijos</span>
                <Calculator className="w-4 h-4 text-[#888888]" />
              </div>
              <p className="font-secondary text-3xl text-[#FAF8F5]">{formatCurrency(activeFixedExpensesTotal)}</p>
              <div className="flex items-center gap-1 text-[10px] text-[#888888]">
                <span>Costes recurrentes mensuales</span>
              </div>
            </div>

            <div className={`${cardClass} border-[#C9A962]/50 bg-[#c9a962]/5`}>
              <div className="flex items-center justify-between">
                <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-widest">Balance Final</span>
                <TrendingUp className={`w-4 h-4 ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <p className={`font-secondary text-3xl ${netBalance >= 0 ? 'text-[#FAF8F5]' : 'text-red-400'}`}>
                {formatCurrency(netBalance)}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#888888]">
                <span>Beneficio neto estimado</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Invoices of Current Month */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] flex flex-col h-full">
              <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between">
                <h3 className="font-primary text-[#FAF8F5] font-bold text-xs uppercase tracking-[0.2em]">Facturas del Mes</h3>
                <span className="text-[10px] text-[#666666] uppercase">{new Date().toLocaleString('es-ES', { month: 'long' })} {currentYear}</span>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                {invoices.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-12 text-[#444444] text-xs font-primary uppercase italic">
                    No hay movimientos registrados este mes
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                        <th className="px-6 py-3 font-primary text-[9px] text-[#666666] uppercase tracking-widest">Cliente / Concepto</th>
                        <th className="px-6 py-3 font-primary text-[9px] text-[#666666] uppercase tracking-widest text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-[#1F1F1F] hover:bg-[#151515] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-primary text-xs text-[#FAF8F5]">{inv.client_name}</span>
                              <span className="font-primary text-[10px] text-[#666666]">{inv.concept}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-secondary text-sm ${inv.type === 'expense' ? 'text-red-400' : 'text-[#C9A962]'}`}>
                            {inv.type === 'expense' ? '-' : '+'}{formatCurrency(inv.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Monthly Chart Simulation */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-primary text-[#FAF8F5] font-bold text-xs uppercase tracking-[0.2em]">Evolución Mensual</h3>
                <Info className="w-4 h-4 text-[#444444]" />
              </div>
              
              <div className="flex-1 flex items-center justify-center pb-4">
                 <div className="w-full max-w-sm flex flex-col gap-8">
                    {/* Progress bars as chart elements */}
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-[10px] font-primary uppercase tracking-widest text-[#888888]">
                          <span>Ingresos</span>
                          <span className="text-[#FAF8F5]">{formatCurrency(totalIncome)}</span>
                       </div>
                       <div className="h-2 bg-[#1F1F1F] w-full rounded-full overflow-hidden">
                          <div 
                            className="bg-[#C9A962] h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (totalIncome / (totalIncome + grandTotalExpenses || 1)) * 100)}%` }}
                          />
                       </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-[10px] font-primary uppercase tracking-widest text-[#888888]">
                          <span>Gastos Variables</span>
                          <span className="text-[#FAF8F5]">{formatCurrency(totalVariableExpenses)}</span>
                       </div>
                       <div className="h-2 bg-[#1F1F1F] w-full rounded-full overflow-hidden">
                          <div 
                            className="bg-red-400/50 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (totalVariableExpenses / (totalIncome + grandTotalExpenses || 1)) * 100)}%` }}
                          />
                       </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-[10px] font-primary uppercase tracking-widest text-[#888888]">
                          <span>Gastos Fijos</span>
                          <span className="text-[#FAF8F5]">{formatCurrency(activeFixedExpensesTotal)}</span>
                       </div>
                       <div className="h-2 bg-[#1F1F1F] w-full rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (activeFixedExpensesTotal / (totalIncome + grandTotalExpenses || 1)) * 100)}%` }}
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-auto pt-6 border-t border-[#1F1F1F] bg-[#0A0A0A]/50 -mx-6 -mb-6 p-6">
                 <p className="font-primary text-[10px] text-[#666666] italic">
                   * La contabilidad se basa en los registros existentes del mes actual. Asegúrate de registrar todas las facturas recibidas y emitidas para precisión.
                 </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Fixed Expenses Tab */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#C9A962]" />
              <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Gestión de Gastos Fijos</h2>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] uppercase tracking-widest hover:bg-[#D4B673] transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuevo Gasto
            </button>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Concepto</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Categoría</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Día Pago</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Importe</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="border-b border-[#C9A962]/30 bg-[#C9A962]/5 animate-in fade-in slide-in-from-top-2">
                    <td className="px-6 py-4">
                      <input 
                        className={inputClass} 
                        placeholder="Nombre del gasto" 
                        value={newExpense.name}
                        onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        className={inputClass} 
                        placeholder="Categoría" 
                        value={newExpense.category}
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                      />
                    </td>
                    <td className="px-6 py-4 flex justify-center mt-2">
                      <input 
                        type="number" 
                        min="1" max="31" 
                        className={`${inputClass} w-20 text-center`} 
                        value={newExpense.day_of_month}
                        onChange={e => setNewExpense({...newExpense, day_of_month: parseInt(e.target.value) || 1})}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                         type="number" 
                         step="0.01" 
                         className={`${inputClass} text-right`} 
                         value={newExpense.amount}
                         onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-[#C9A962] uppercase tracking-wider">Nuevo</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSaveExpense} className="text-[#C9A962] hover:text-[#D4B673]"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsAdding(false)} className="text-[#888888] hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )}

                {fixedExpenses.length === 0 && !isAdding ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#444444] font-primary text-xs uppercase italic">
                      No hay gastos fijos configurados
                    </td>
                  </tr>
                ) : (
                  fixedExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-[#1F1F1F] hover:bg-[#111111] transition-colors">
                      <td className="px-6 py-4 font-primary text-xs text-[#FAF8F5]">{expense.name}</td>
                      <td className="px-6 py-4 font-primary text-[10px] text-[#666666] uppercase">{expense.category}</td>
                      <td className="px-6 py-4 font-primary text-xs text-[#888888] text-center">{expense.day_of_month || '-'}</td>
                      <td className="px-6 py-4 font-secondary text-sm text-[#FAF8F5] text-right">{formatCurrency(expense.amount)}</td>
                      <td className="px-6 py-4 text-center">
                         <button 
                            onClick={() => updateFixedExpense(expense.id, { is_active: !expense.is_active })}
                           className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                             expense.is_active 
                               ? 'border-green-400/30 text-green-400 bg-green-400/5' 
                               : 'border-red-400/30 text-red-400 bg-red-400/5'
                           }`}
                         >
                           {expense.is_active ? 'Activo' : 'Inactivo'}
                         </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-3">
                           <button onClick={() => deleteFixedExpense(expense.id)} className="text-[#444444] hover:text-red-400 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-[#C9A962]/5 border border-[#C9A962]/20">
             <Info className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
             <p className="font-primary text-xs text-[#888888] leading-relaxed">
               Los <strong>Gastos Fijos</strong> son aquellos costes recurrentes que tienes cada mes (alquiler, seguros, cuotas). 
               Estos no necesitan factura en el sistema para contar en el balance mensual de contabilidad, se suman automáticamente si están marcados como "Activos".
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
