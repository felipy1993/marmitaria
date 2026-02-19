
import React from 'react';
import { X, Edit3, Trash2, Plus, Tag, ArrowRight, ArrowLeft } from 'lucide-react';
import { OrderItem, Coupon } from '../../types';

interface CartDrawerProps {
  items: OrderItem[];
  subtotal: number;
  finalTotal: number;
  discountAmount: number;
  appliedCoupon: Coupon | null;
  couponInput: string;
  hasMarmitaInCart: boolean;
  onClose: () => void;
  onEditItem: (item: OrderItem) => void;
  onRemoveItem: (productId: string) => void;
  onApplyCoupon: () => void;
  onSetCouponInput: (val: string) => void;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  subtotal,
  finalTotal,
  discountAmount,
  appliedCoupon,
  couponInput,
  hasMarmitaInCart,
  onClose,
  onEditItem,
  onRemoveItem,
  onApplyCoupon,
  onSetCouponInput,
  onRemoveCoupon,
  onCheckout
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Sua Sacola</h2>
            <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">{items.length} itens no pedido</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
          {items.map(item => (
            <div key={item.productId} className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 relative group hover:border-orange-200 transition-all duration-300">
              <div className="absolute top-4 right-4 flex gap-1 cursor-pointer">
                <button onClick={() => onEditItem(item)} className="text-slate-200 hover:text-orange-500 p-1.5 transition-colors"><Edit3 size={16} /></button>
                <button onClick={() => onRemoveItem(item.productId)} className="text-slate-200 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={16} /></button>
              </div>
              <h4 className="font-black text-base text-slate-900 pr-12 leading-tight">{item.name}</h4>
              
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <div className="space-y-1">
                  {item.selectedOptions.map((opt, idx) => (
                    <p key={opt.groupName + idx} className="text-[9px] text-slate-400 font-bold leading-tight">
                      <span className="text-orange-500/70 uppercase mr-1">{opt.groupName}:</span> {opt.items.join(', ')}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-2 border-t border-slate-50">
                <span className="text-slate-400">Qtd: {item.quantity}</span>
                <span className="text-orange-600">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="mt-8 pt-8 border-t border-slate-50">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Código Promocional</p>
             <div className="flex gap-2">
                <input 
                  className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase outline-none focus:border-orange-500 focus:bg-white transition-all text-xs" 
                  placeholder="EX: TRINTAOFF" 
                  value={couponInput} 
                  onChange={e => onSetCouponInput(e.target.value.toUpperCase())}
                />
                <button onClick={onApplyCoupon} className="px-5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-95">
                  <Plus size={20} />
                </button>
             </div>
             {appliedCoupon && (
               <div className="mt-3 flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl animate-fade-in group">
                  <div className="flex items-center gap-2">
                     <Tag size={14} className="text-orange-500" />
                     <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={onRemoveCoupon} className="text-slate-300 hover:text-orange-500 transition-colors"><X size={14} /></button>
               </div>
             )}
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-white space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-xs text-green-600">
                <span>CUPOM: {appliedCoupon.code}</span>
                <span>- R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-slate-50">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-2xl font-black text-orange-500 tracking-tight">R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={!hasMarmitaInCart} 
            onClick={onCheckout} 
            className="w-full py-4 bg-orange-500 text-white font-black text-sm uppercase rounded-lg shadow-sm hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
          >
            Escolher Endereço
            <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={onClose} 
            className="w-full py-4 border-2 border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <ArrowLeft size={14} />
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
