
import React from 'react';
import { X, ClipboardList, ShoppingBag, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface MyOrdersModalProps {
  myOrders: Order[];
  onClose: () => void;
  onViewDetails: (order: Order) => void;
  onRepeatOrder: (order: Order) => void;
}

const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  myOrders,
  onClose,
  onViewDetails,
  onRepeatOrder
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
       <div className="bg-white rounded-none md:rounded-2xl shadow-xl max-w-2xl w-full h-full md:h-[80vh] overflow-hidden animate-slide-up flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                   <ClipboardList size={22} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 leading-tight">Meus Pedidos</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico e status atual</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 transition-all"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar bg-slate-50/50">
             {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <ShoppingBag size={32} />
                   </div>
                   <div>
                      <p className="font-black text-slate-800">Você ainda não fez nenhum pedido.</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">Que tal pedir uma marmita deliciosa hoje?</p>
                   </div>
                </div>
             ) : (
                myOrders.map(order => (
                   <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-orange-200 transition-all">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{order.id?.slice(-6)}</p>
                            <p className="text-xs font-bold text-slate-900">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                         </div>
                         <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            order.status === OrderStatus.FINISHED ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600 animate-pulse'
                         }`}>
                            {order.status}
                         </div>
                      </div>

                      <div className="flex items-center gap-4 py-3 border-y border-slate-50">
                         <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-bold">Itens do Pedido</p>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                               {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold">Total</p>
                            <p className="text-sm font-black text-orange-500">R$ {order.total.toFixed(2)}</p>
                         </div>
                      </div>

                      <div className="flex gap-2">
                         <button 
                            onClick={() => onViewDetails(order)}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                         >
                            Ver Status
                         </button>
                         <button 
                            onClick={() => onRepeatOrder(order)}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                         >
                            <RefreshCw size={14} /> Repetir Pedido
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>
    </div>
  );
};

export default MyOrdersModal;
