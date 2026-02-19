
import React from 'react';
import { X, Truck, ShoppingBag, User, MapPin, Loader2, Building2, CreditCard, MessageSquare, Check, ArrowRight } from 'lucide-react';
import { PaymentMethod, RestaurantConfig } from '../../types';

interface CheckoutModalProps {
  finalTotal: number;
  deliveryType: 'delivery' | 'pickup';
  formData: any;
  config: RestaurantConfig | null;
  isStoreOpen: boolean;
  isOutsideRadius: boolean;
  isSearchingCep: boolean;
  cashAmount: string;
  onClose: () => void;
  setDeliveryType: (val: 'delivery' | 'pickup') => void;
  setFormData: (val: any) => void;
  onCepChange: (cep: string) => void;
  setCashAmount: (val: string) => void;
  onCheckout: (e: React.FormEvent) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  finalTotal,
  deliveryType,
  formData,
  config,
  isStoreOpen,
  isOutsideRadius,
  isSearchingCep,
  cashAmount,
  onClose,
  setDeliveryType,
  setFormData,
  onCepChange,
  setCashAmount,
  onCheckout
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-orange-500/10 border border-white/20">
         {/* Lado Esquerdo - Info Refinada */}
         <div className="hidden md:flex w-72 bg-slate-900 px-10 py-12 flex-col justify-between text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-60"></div>
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <Truck size={24} className="text-orange-500" />
              </div>
              <h3 className="text-2xl font-black leading-tight tracking-tight italic">Quase lá! 🥘</h3>
              <p className="text-slate-400 font-bold text-xs leading-relaxed">Confira seus dados para que sua marmita chegue perfeita para você.</p>
            </div>
            <div className="relative z-10 p-5 bg-white/5 rounded-2xl border border-white/10">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Resumo da Compra</p>
               <p className="text-2xl font-black text-white tracking-tight">R$ {finalTotal.toFixed(2)}</p>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar bg-white">
            <div className="flex justify-between items-start mb-8 md:mb-10">
               <div>
                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Finalizar Pedido</h2>
                 <p className="text-slate-400 font-bold text-xs mt-1">Sua refeição está a poucos cliques de distância.</p>
               </div>
               <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 transition-all">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={onCheckout} className="space-y-12">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
                <button 
                  type="button" 
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryType === 'delivery' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}
                >
                  <Truck size={16} /> Entrega
                </button>
                <button 
                  type="button" 
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryType === 'pickup' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}
                >
                  <ShoppingBag size={16} /> Retirada
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                    <User size={14} />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Quem vai receber</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500/50 focus:bg-white transition-all text-sm" placeholder="Nome" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">WhatsApp</label>
                    <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500/50 focus:bg-white transition-all text-sm" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Seção 2: Onde Entregar */}
              {deliveryType === 'delivery' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <MapPin size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Onde Entregar</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CEP</label>
                      <div className="relative">
                        <input required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="00000-000" value={formData.cep} onChange={e => onCepChange(e.target.value)} />
                        {isSearchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={16} />}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bairro</label>
                      <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Ex: Centro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                    </div>
                    
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rua / Logradouro</label>
                      <input required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Nome da rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número</label>
                      <input id="address-number" required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="123" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 text-center animate-fade-in space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 shadow-sm">
                    <Building2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-orange-900 text-sm uppercase tracking-widest mb-1">Retirar no Local</h4>
                    <p className="text-slate-700 font-black text-xl leading-tight">{config?.addressBase || 'Endereço não configurado'}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl inline-block border border-orange-100">
                    <p className="text-[10px] text-orange-800 font-bold uppercase tracking-widest">Tempo estimado de preparo</p>
                    <p className="text-lg font-black text-slate-900">30 - 45 min</p>
                  </div>
                </div>
              )}

              {/* Seção 3: Pagamento */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <CreditCard size={18} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Pagamento na Entrega</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: PaymentMethod.PIX, icon: '💠', label: 'Pix' },
                    { id: PaymentMethod.CARD, icon: '💳', label: 'Cartão' },
                    { id: PaymentMethod.CASH, icon: '💵', label: 'Dinheiro' }
                  ].map(method => (
                    <button 
                      key={method.id}
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: method.id})}
                      className={`flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all ${
                        formData.paymentMethod === method.id 
                        ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-lg shadow-orange-500/10' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Instruções para PIX */}
                {formData.paymentMethod === PaymentMethod.PIX && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-blue-900 mb-1">Importante!</h5>
                        <p className="text-xs text-blue-700 font-bold leading-relaxed">
                          Após fazer o PIX, envie o comprovante pelo WhatsApp para confirmar seu pedido.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Campo de Troco para Dinheiro */}
                {formData.paymentMethod === PaymentMethod.CASH && (
                  <div className="mt-4 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                      Vai pagar com quanto? (Opcional)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder={`Total: R$ ${finalTotal.toFixed(2)}`}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300"
                    />
                    {cashAmount && parseFloat(cashAmount) > finalTotal && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                          <p className="text-sm font-black text-green-900">
                            Troco: R$ {(parseFloat(cashAmount) - finalTotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {/* Botão Finalizar */}
               <div className="pt-6">
                 <button 
                   type="submit" 
                   disabled={!isStoreOpen || (deliveryType === 'delivery' && (isOutsideRadius || !formData.street)) || !formData.customerName || !formData.phone}
                   className="w-full py-7 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-orange-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale"
                 >
                   {!isStoreOpen ? 'Loja Fechada no Momento' : (isOutsideRadius ? 'Fora do Raio de Entrega' : 'Confirmar e Enviar Pedido')}
                   {isStoreOpen && !isOutsideRadius && <ArrowRight size={24} />}
                 </button>
                 {!isStoreOpen && (
                   <p className="text-center text-xs font-bold text-red-500 mt-4">
                     Horário de atendimento: {config?.openingTime} às {config?.closingTime}
                   </p>
                 )}
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
