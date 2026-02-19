
import React from 'react';
import { Product, OptionGroup, OptionItem } from '../../types';
import { 
  X, Save, Wand2, Calendar, Check, Camera, 
  Image as ImageIcon, Zap, PlusCircle, Trash2, Plus
} from 'lucide-react';

interface AdminProductModalProps {
  editingProduct: Product | null;
  formData: any;
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  toggleDay: (day: number) => void;
  applyTemplate: (tpl: any) => void;
  applyPresetGroup: (preset: any) => void;
  addOptionGroup: () => void;
  updateGroup: (id: string, updates: Partial<OptionGroup>) => void;
  removeGroup: (id: string) => void;
  addOptionItem: (groupId: string) => void;
  updateOptionItem: (groupId: string, itemIdx: number, updates: Partial<OptionItem>) => void;
  formatImageUrl: (url?: string) => string | null;
  WEEK_DAYS: any[];
  DISH_TEMPLATES: any[];
  PRESET_GROUPS: any[];
  GROUPED_ASSETS: any;
  AVAILABLE_ASSETS: string[];
}

const AdminProductModal: React.FC<AdminProductModalProps> = ({
  editingProduct,
  formData,
  setFormData,
  onClose,
  onSubmit,
  toggleDay,
  applyTemplate,
  applyPresetGroup,
  addOptionGroup,
  updateGroup,
  removeGroup,
  addOptionItem,
  updateOptionItem,
  formatImageUrl,
  WEEK_DAYS,
  DISH_TEMPLATES,
  PRESET_GROUPS,
  GROUPED_ASSETS,
  AVAILABLE_ASSETS
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl relative z-10 animate-scale-in max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-3xl font-black text-slate-900">{editingProduct ? 'Editar' : 'Novo'} Item</h2>
                <p className="text-slate-400 font-bold text-sm">Configure a visibilidade e os detalhes do seu item.</p>
            </div>
            <div className="flex items-center gap-6">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Visível no Cardápio</span>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, active: !formData.active})}
                    className={`w-14 h-8 rounded-full relative transition-all flex items-center px-1 ${formData.active ? 'bg-green-500' : 'bg-slate-200'}`}
                  >
                     <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
               </label>
               <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X size={20} /></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 no-scrollbar">
          <form onSubmit={onSubmit} className="space-y-12">
            {/* Seção de Modelos Rápidos */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <Wand2 size={20} />
                  <h3 className="font-black uppercase tracking-widest text-xs">Modelos Rápidos</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {DISH_TEMPLATES.map((tpl, i) => (
                    <button key={i} type="button" onClick={() => applyTemplate(tpl)} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] hover:border-orange-500 hover:bg-orange-50 transition-all group">
                       <span className="text-3xl group-hover:scale-110 transition-transform">{tpl.icon}</span>
                       <div className="text-left">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{tpl.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold">Auto-preencher formulário</p>
                       </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Prato/Produto</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Marmita de Bife Acebolado" />
              </div>
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black text-slate-400 uppercase">Descrição Curta</label>
                </div>
                <textarea required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva os ingredientes principais..." />
              </div>

              {/* Disponibilidade Semanal */}
              <div className="md:col-span-2 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                <div className="flex items-center gap-3 mb-6 text-slate-700">
                  <Calendar size={20} className="text-orange-500" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Disponibilidade Semanal</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {WEEK_DAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-14 h-14 rounded-2xl font-black text-xs transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                        formData.availableDays.includes(day.value) 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {day.label}
                      {formData.availableDays.includes(day.value) && <Check size={12} className="text-orange-500" />}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  O item aparecerá automaticamente no cardápio apenas nos dias selecionados acima.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Link da Imagem</label>
                <div className="flex flex-col gap-4">
                  <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  <div className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-300" />}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço Base (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none text-xl" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Categoria</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Marmitas">🍱 Marmitas</option>
                    <option value="Bebidas">🥤 Bebidas</option>
                    <option value="Sobremesas">🍩 Sobremesas</option>
                    <option value="Outros">📦 Outros</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personalização / Opções */}
            <div className="space-y-8 pt-10 border-t border-slate-100">
              <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100">
                <div className="flex items-center gap-3 mb-6 text-orange-600">
                  <Zap size={20} className="fill-orange-600" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Presets Rápidos de Grupos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PRESET_GROUPS.map((preset, idx) => (
                    <button key={idx} type="button" onClick={() => applyPresetGroup(preset)} className="flex flex-col items-center gap-2 p-4 bg-white border border-orange-200 rounded-2xl hover:shadow-lg hover:border-orange-400 transition-all group">
                      <span className="text-3xl group-hover:scale-125 transition-transform">{preset.icon}</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase text-center">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center px-2">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Grupos de Personalização</h3>
                  <p className="text-sm font-medium text-slate-500">O que o cliente pode escolher nesta marmita?</p>
                </div>
                <button type="button" onClick={addOptionGroup} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all">
                  <PlusCircle size={16} /> Novo Grupo Manual
                </button>
              </div>

              <div className="space-y-6">
                {formData.optionsGroups.map((group: any) => (
                  <div key={group.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6 animate-fade-in relative group/card">
                    <button type="button" onClick={() => removeGroup(group.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100"><Trash2 size={20} /></button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Título do Grupo</label>
                          <input className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.name} onChange={e => updateGroup(group.id, { name: e.target.value })} placeholder="Ex: Escolha o acompanhamento" />
                       </div>
                       <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Mínimo</label>
                            <input type="number" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.min} onChange={e => updateGroup(group.id, { min: parseInt(e.target.value) })} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Máximo</label>
                            <input type="number" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.max} onChange={e => updateGroup(group.id, { max: parseInt(e.target.value) })} />
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Preço Extra por Item (R$)</label>
                          <input type="number" step="0.01" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.extraPricePerItem || 0} onChange={e => updateGroup(group.id, { extraPricePerItem: parseFloat(e.target.value) })} />
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase px-1">Itens Disponíveis</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 relative group/opt">
                            <button type="button" onClick={() => updateGroup(group.id, { items: group.items.filter((_: any, i: number) => i !== iIdx) })} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"><X size={14} /></button>
                            
                            <div className="space-y-2">
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Nome</label>
                              <input className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold focus:border-orange-500 outline-none" value={item.name} onChange={e => updateOptionItem(group.id, iIdx, { name: e.target.value })} placeholder="Nome do item" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate">Preço Adic. (R$)</label>
                                <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold focus:border-orange-500 outline-none" value={item.price || ''} onChange={e => updateOptionItem(group.id, iIdx, { price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-[8px] font-black text-slate-400 uppercase">Imagem do Item</label>
                                <div className="flex gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    {item.imageUrl ? (
                                      <img 
                                        src={formatImageUrl(item.imageUrl)!} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=?'; }}
                                      />
                                    ) : (
                                      <ImageIcon size={16} className="text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <select 
                                      className="w-full px-3 py-2 rounded-lg border border-slate-100 text-[10px] font-bold focus:border-orange-500 outline-none bg-white"
                                      value={AVAILABLE_ASSETS.includes(item.imageUrl || '') ? item.imageUrl : ''}
                                      onChange={e => updateOptionItem(group.id, iIdx, { imageUrl: e.target.value })}
                                    >
                                      <option value="">{item.imageUrl && !AVAILABLE_ASSETS.includes(item.imageUrl) ? '-- Link Externo --' : 'Selecionar da Pasta'}</option>
                                      {Object.entries(GROUPED_ASSETS).map(([category, assets]: any) => (
                                        <optgroup key={category} label={category}>
                                          {assets.map((asset: string) => (
                                            <option key={asset} value={asset}>{asset.replace('.png', '').replace(/-/g, ' ')}</option>
                                          ))}
                                        </optgroup>
                                      ))}
                                      <option value="CUSTOM">-- Outro (Link Manual) --</option>
                                    </select>
                                    
                                    {(!AVAILABLE_ASSETS.includes(item.imageUrl || '') || item.imageUrl === 'CUSTOM') && (
                                      <input 
                                        className="w-full px-3 py-1.5 mt-1 rounded-lg border border-slate-100 text-[9px] font-bold focus:border-orange-500 outline-none" 
                                        value={item.imageUrl === 'CUSTOM' ? '' : item.imageUrl || ''} 
                                        onChange={e => updateOptionItem(group.id, iIdx, { imageUrl: e.target.value })} 
                                        placeholder="Cole o link aqui..."
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addOptionItem(group.id)} className="px-4 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all flex flex-col items-center justify-center gap-2 bg-white">
                           <Plus size={18} /> Nova Opção
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 md:p-10 border-t border-slate-100 bg-slate-50/50 shrink-0">
           <div className="flex gap-4 max-w-xl mx-auto">
              <button type="button" onClick={onClose} className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">Cancelar</button>
              <button type="button" onClick={onSubmit} className="flex-1 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Save size={20} /> Salvar Item
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductModal;
