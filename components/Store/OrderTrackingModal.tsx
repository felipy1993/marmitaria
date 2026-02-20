
import React from 'react';
import { X, Clock, MessageSquare } from 'lucide-react';
import { Order, PaymentMethod, RestaurantConfig } from '../../types';

interface OrderTrackingModalProps {
  activeOrder: Order;
  config: RestaurantConfig | null;
  onClose: () => void;
  onBackToStart: () => void;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  activeOrder,
  config,
  onClose,
  onBackToStart
}) => {
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'recebido': return 'Pedido recebido! Aguardando confirmação da loja.';
      case 'em preparo': return 'Seu pedido está sendo preparado com carinho!';
      case 'saiu para entrega': return 'O entregador já saiu com seu pedido!';
      case 'finalizado': return 'Pedido entregue! Bom apetite! 😋';
      default: return 'Estamos cuidando do seu pedido.';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
       <div className="bg-white rounded-none md:rounded-2xl shadow-xl max-w-lg w-full h-full md:h-auto overflow-hidden animate-slide-up flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
             <h2 className="text-lg font-bold text-slate-900">Acompanhar Pedido</h2>
             <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
             <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight capitalize">{activeOrder.status}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {getStatusMessage(activeOrder.status)}
                  </p>
                </div>
             </div>

             {activeOrder.paymentMethod === PaymentMethod.PIX && (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                   <h4 className="font-bold text-sm text-slate-900">Pagamento Necessário</h4>
                   <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                     <p className="text-center text-lg font-black text-slate-800 mb-2">Chave Pix: 12.345.678/0001-99</p>
                     <p className="text-center text-[10px] font-bold text-slate-400">Copie o CNPJ acima e pague no seu app do banco.</p>
                   </div>
                   <button className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                     Copiar Chave Pix
                   </button>
                </div>
             )}

              <div className="pt-2 space-y-3">
                <button 
                  onClick={() => {
                    const whatsappNumber = config?.whatsappNumber?.replace(/\D/g, '') || '5511999999999';
                    const text = encodeURIComponent(`Olá, realizei o pedido #${activeOrder.id?.slice(-6)} e gostaria de falar com o restaurante.`);
                    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
                  }} 
                  className="w-full py-4 bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-3 hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                >
                  <MessageSquare size={18} /> Conversar com a Loja
                </button>
                
                <button 
                  onClick={onBackToStart} 
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all mt-4"
                >
                  Voltar para o Início
                </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default OrderTrackingModal;
