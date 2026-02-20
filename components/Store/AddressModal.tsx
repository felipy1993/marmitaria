
import React from 'react';
import { X, MapPin, Loader2, Check, ArrowRight, Truck } from 'lucide-react';

interface AddressModalProps {
  formData: any;
  isSearchingCep: boolean;
  isOutsideRadius: boolean;
  onClose: () => void;
  onCepChange: (cep: string) => void;
  onGetLocation: () => void;
  setFormData: (val: any) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  formData,
  isSearchingCep,
  isOutsideRadius,
  onClose,
  onCepChange,
  onGetLocation,
  setFormData,
}) => {
  const isComplete = formData.cep?.length === 8 && formData.street;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 md:p-10 animate-scale-in border border-white/20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                <MapPin size={18} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Onde entregar?</h2>
            </div>
            <p className="text-slate-400 font-bold text-xs ml-10">Confirme seu endereço para ver as opções e taxas.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* CEP e Localização */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
              <button 
                type="button" 
                onClick={onGetLocation}
                className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider hover:text-orange-600 transition-colors"
                disabled={isSearchingCep}
              >
                <MapPin size={12} />
                Usar localização atual
              </button>
            </div>
            <div className="relative">
              <input 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300 shadow-sm shadow-slate-100" 
                placeholder="00000-000" 
                value={formData.cep} 
                onChange={e => onCepChange(e.target.value)} 
                maxLength={9}
              />
              {isSearchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={16} />}
            </div>
          </div>

          {/* Rua e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rua / Logradouro</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" 
                placeholder="Ex: Rua das Flores" 
                value={formData.street} 
                onChange={e => setFormData({...formData, street: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número</label>
              <input 
                id="address-modal-number"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" 
                placeholder="123" 
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})} 
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bairro</label>
            <input 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" 
              placeholder="Ex: Vila Nova" 
              value={formData.neighborhood} 
              onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
            />
          </div>

          {isOutsideRadius && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-slide-up">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <X size={16} />
              </div>
              <p className="text-xs text-red-600 font-bold leading-relaxed">
                Infelizmente ainda não entregamos nesta região.
              </p>
            </div>
          )}

          {!isOutsideRadius && isComplete && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-slide-up">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <Check size={16} />
              </div>
              <p className="text-xs text-green-700 font-bold leading-relaxed">
                Tudo certo! Atendemos sua região perfeitamente.
              </p>
            </div>
          )}

          <button 
            onClick={onClose}
            disabled={!isComplete || isOutsideRadius}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
          >
            {isOutsideRadius ? 'Fora da Área de Entrega' : 'Confirmar Endereço'}
            {!isOutsideRadius && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
