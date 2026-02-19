
import React from 'react';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { Product, OptionGroup } from '../../types';

interface CustomizationDrawerProps {
  customizingProduct: Product;
  editingCartItemId: string | null;
  currentSelections: Record<string, Record<string, number>>;
  observation: string;
  itemQuantity: number;
  isStoreOpen: boolean;
  onClose: () => void;
  getOptionQuantity: (groupId: string, itemName: string) => number;
  addOption: (groupId: string, itemName: string, group: OptionGroup) => void;
  removeOption: (groupId: string, itemName: string) => void;
  setObservation: (val: string) => void;
  setItemQuantity: (val: number | ((prev: number) => number)) => void;
  calculateCurrentPrice: () => number;
  isSelectionValid: () => boolean;
  confirmCustomization: () => void;
  formatImageUrl: (url?: string) => string | null;
}

const CustomizationDrawer: React.FC<CustomizationDrawerProps> = ({
  customizingProduct,
  editingCartItemId,
  currentSelections,
  observation,
  itemQuantity,
  isStoreOpen,
  onClose,
  getOptionQuantity,
  addOption,
  removeOption,
  setObservation,
  setItemQuantity,
  calculateCurrentPrice,
  isSelectionValid,
  confirmCustomization,
  formatImageUrl
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in overflow-hidden md:rounded-l-[3.5rem]">
        {/* Header da Customização */}
        <div className="p-8 md:p-10 border-b border-slate-50 shrink-0 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div>
               <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] mb-2 inline-block">Personalizar Marmita</span>
               <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight italic">
                 {editingCartItemId ? 'Ajustar Pedido' : customizingProduct.name}
               </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={20} className="text-slate-300" /></button>
          </div>
          <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img src={customizingProduct.imageUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={customizingProduct.name} />
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-1">{customizingProduct.name}</h3>
                <p className="text-orange-500 font-extrabold text-sm tracking-tight">R$ {customizingProduct.price.toFixed(2)}</p>
              </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 no-scrollbar">
          {customizingProduct.optionsGroups?.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                <div>
                  <h4 className="text-base font-black text-slate-800">{group.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {group.min > 0 ? (
                      <span className="text-orange-500">Obrigatório • Selecione pelo menos {group.min}</span>
                    ) : (
                      <span className="text-slate-400 font-bold">Opcional</span>
                    )}
                    {group.max > 0 && ` • Até ${group.max} itens`}
                    {group.extraPricePerItem ? ` • +R$ ${group.extraPricePerItem.toFixed(2)} por adicional` : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {group.items.map(item => (
                  <div 
                    key={item.name} 
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all group/item ${
                      getOptionQuantity(group.id, item.name) > 0 
                      ? 'border-orange-500 bg-orange-50/30' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {item.imageUrl ? (
                          <img src={formatImageUrl(item.imageUrl)!} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white" alt={item.name} />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-white">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        {getOptionQuantity(group.id, item.name) > 0 && (
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-black scale-110 shadow-lg shadow-orange-500/20">
                            {getOptionQuantity(group.id, item.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`font-black text-sm tracking-tight transition-colors block ${
                          getOptionQuantity(group.id, item.name) > 0 ? 'text-slate-900' : 'text-slate-600'
                        }`}>
                          {item.name}
                        </span>
                        {item.price && item.price > 0 && (
                          <span className="text-[10px] font-bold text-orange-500 mt-0.5 block">
                            + R$ {item.price.toFixed(2)}
                          </span>
                        )}
                        {group.extraPricePerItem && group.extraPricePerItem > 0 && 
                         Object.values(currentSelections[group.id] || {}).reduce((a, b: number) => a + b, 0) >= group.max && (
                          <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md mt-1 inline-block">
                            + R$ {group.extraPricePerItem.toFixed(2)} adicional
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {getOptionQuantity(group.id, item.name) > 0 && (
                         <button 
                           onClick={() => removeOption(group.id, item.name)}
                           className="p-2 hover:bg-orange-100 text-orange-600 rounded-lg transition-all"
                         >
                            <Minus size={16} />
                         </button>
                      )}
                      {getOptionQuantity(group.id, item.name) > 0 && (
                        <span className="w-8 text-center font-black text-sm text-slate-900">
                           {getOptionQuantity(group.id, item.name)}
                        </span>
                      )}
                      <button 
                        onClick={() => addOption(group.id, item.name, group)}
                        className="p-2 hover:bg-orange-100 text-orange-600 rounded-lg transition-all"
                      >
                         <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-3">
             <h4 className="text-base font-black text-slate-800">Observações</h4>
             <textarea placeholder="Ex: Sem cebola..." className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-400/50 outline-none font-bold min-h-[100px] text-xs transition-all placeholder:text-slate-300" value={observation} onChange={e => setObservation(e.target.value)} />
          </div>
        </div>

        {/* Footer de Ação Refinado */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-5 shrink-0">
           <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                <button 
                  onClick={() => setItemQuantity((prev: number) => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                >
                  <Minus size={20} />
                </button>
                <span className="w-8 text-center font-black text-lg text-slate-900">{itemQuantity}</span>
                <button 
                  onClick={() => setItemQuantity((prev: number) => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="text-right">
                <span className="text-slate-300 font-black uppercase text-[9px] tracking-[0.2em] mb-1 block">Total do Item</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">R$ {(calculateCurrentPrice() * itemQuantity).toFixed(2)}</span>
              </div>
           </div>
            <button 
            onClick={confirmCustomization} 
            disabled={!isStoreOpen || !isSelectionValid()} 
            className={`w-full py-4 font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all ${
              isStoreOpen ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-500'
            }`}
          >
             {editingCartItemId ? 'Salvar Alterações' : isStoreOpen ? 'Adicionar à Sacola' : 'Loja Fechada'}
             {!editingCartItemId && isStoreOpen && <Plus size={18} />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationDrawer;
