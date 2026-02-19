
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { 
  Clock, Truck, CheckCircle2, Phone, Printer, RotateCcw
} from 'lucide-react';

interface AdminOrderCardProps {
  order: Order;
  activeTab: 'active' | 'finished';
  getStatusColor: (status: OrderStatus) => string;
  handlePrintReceipt: (order: Order) => void;
  handleStatusChange: (order: Order, status: OrderStatus) => void;
}

const AdminOrderCard: React.FC<AdminOrderCardProps> = ({
  order,
  activeTab,
  getStatusColor,
  handlePrintReceipt,
  handleStatusChange
}) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
      <div className="flex flex-col lg:flex-row justify-between gap-10">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente</span>
              <h3 className="text-2xl font-black text-slate-900">{order.customerName}</h3>
              <div className="flex items-center gap-4 mt-1">
                 <p className="text-slate-400 text-xs font-bold flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString()}</p>
                 <a href={`https://wa.me/55${order.phone.replace(/\D/g,'')}`} target="_blank" className="text-green-600 text-xs font-bold flex items-center gap-1 hover:underline"><Phone size={12} /> WhatsApp</a>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-xl text-[10px] font-black border ${getStatusColor(order.status)} uppercase tracking-widest`}>
              {order.status}
            </span>
          </div>

          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-start gap-3">
              <Truck size={20} className="text-slate-400 mt-1" />
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrega em</p>
                <p className="text-slate-700 font-bold">{order.address}</p>
              </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">Itens do Pedido</h4>
            <div className="grid grid-cols-1 gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-black text-slate-900">{item.quantity}x {item.name}</p>
                  {item.selectedOptions && item.selectedOptions.map(opt => (
                    <p key={opt.groupName} className="text-[10px] text-slate-400 font-bold uppercase mt-1">{opt.groupName}: {opt.items.join(' • ')}</p>
                  ))}
                  {item.observation && <p className="mt-2 text-xs font-bold text-orange-600 italic">"{item.observation}"</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[2rem] text-white">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Pagamento: {order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                <p className="text-2xl font-black text-orange-400">R$ {order.total.toFixed(2)}</p>
              </div>
          </div>
        </div>

         {activeTab === 'active' ? (
           <div className="lg:w-72 space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ações</p>
             <button onClick={() => handlePrintReceipt(order)} className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black border border-slate-900 transition-all shadow-lg shadow-slate-900/10">
               <span>Imprimir Recibo</span> <Printer size={20} />
             </button>
             <button onClick={() => handleStatusChange(order, OrderStatus.PREPARING)} className="w-full flex items-center justify-between px-6 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black hover:bg-orange-100 border border-orange-100 transition-all">
               <span>Preparo</span> <Clock size={20} />
             </button>
             <button onClick={() => handleStatusChange(order, OrderStatus.DELIVERING)} className="w-full flex items-center justify-between px-6 py-4 bg-purple-50 text-purple-600 rounded-2xl font-black hover:bg-purple-100 border border-purple-100 transition-all">
               <span>Saiu p/ Entrega</span> <Truck size={20} />
             </button>
             <button onClick={() => handleStatusChange(order, OrderStatus.FINISHED)} className="w-full flex items-center justify-between px-6 py-4 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-100 border border-green-100 transition-all">
               <span>Finalizar</span> <CheckCircle2 size={20} />
             </button>
           </div>
         ) : (
           <div className="lg:w-72 space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ações</p>
             <button onClick={() => handlePrintReceipt(order)} className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black border border-slate-900 transition-all">
               <span>Imprimir Recibo</span> <Printer size={20} />
             </button>
             <button onClick={() => handleStatusChange(order, OrderStatus.RECEIVED)} className="w-full flex items-center justify-between px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 border border-slate-200 transition-all">
               <span>Reabrir Pedido</span> <RotateCcw size={20} />
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

export default AdminOrderCard;
