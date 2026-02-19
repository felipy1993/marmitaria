
import React, { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/database';
import { Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Truck, CheckCircle2, ClipboardList, Eye, Phone, MessageSquare, ExternalLink,
  Archive, RotateCcw, Search, Filter, Printer
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';

// Novos componentes refatorados
import AdminOrderCard from '../components/Admin/AdminOrderCard';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders: Order[]) => {
      setOrders(newOrders);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    try {
      await updateOrderStatus(order.id!, status);
      showToast(`Status do pedido atualizado para: ${status}`);
      
      const cleanPhone = order.phone.replace(/\D/g, '');
      let message = '';
      if (status === OrderStatus.PREPARING) {
        message = `Olá *${order.customerName}*! 👋\n\nSeu pedido na *Sabor de Casa* entrou em preparo! 🍱🔥`;
      } else if (status === OrderStatus.DELIVERING) {
        message = `Olá *${order.customerName}*! 👋\n\nSeu pedido *saiu para entrega*! 🛵💨`;
      }
      if (message) {
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredOrders = orders.filter((order: Order) => {
    const isTabMatch = activeTab === 'active' 
      ? order.status !== OrderStatus.FINISHED 
      : order.status === OrderStatus.FINISHED;
    
    const isSearchMatch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.phone.includes(searchTerm);
    
    return isTabMatch && isSearchMatch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case OrderStatus.DELIVERING: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.FINISHED: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const activeCount = orders.filter((o: Order) => o.status !== OrderStatus.FINISHED).length;

  return (
    <AdminLayout activeOrdersCount={activeCount}>
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Gerenciar Pedidos</h2>
            <p className="text-slate-500 font-medium">Acompanhe e atualize o status dos pedidos em tempo real</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white shadow-sm font-bold text-sm"
              />
            </div>
          </div>
        </header>

        <div className="flex gap-4 p-1 bg-slate-200/50 rounded-2xl mb-8 w-fit">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Ativos ({activeCount})
            </button>
            <button 
              onClick={() => setActiveTab('finished')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'finished' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Finalizados
            </button>
         </div>

        <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
              <ClipboardList size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 text-lg font-bold">Nenhum pedido encontrado nesta aba.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <AdminOrderCard 
                key={order.id}
                order={order}
                activeTab={activeTab}
                getStatusColor={getStatusColor}
                handlePrintReceipt={handlePrintReceipt}
                handleStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>

       <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          .print-receipt-admin, .print-receipt-admin * { 
            visibility: visible; 
            display: block !important;
          }
          .print-receipt-admin { 
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', Courier, monospace;
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Recibo Invisível (Somente Print) */}
      <div className="print-receipt-admin hidden print:block">
        {orderToPrint && (
          <div className="print-item">
            <div className="text-center font-bold text-lg mb-1 uppercase tracking-tighter">SABOR DE CASA</div>
            <div className="text-center text-[10px] mb-4 uppercase tracking-widest">Recibo do Cliente</div>
            
            <div className="text-[10px] space-y-0.5 mb-4">
              <p><strong>PEDIDO:</strong> #{orderToPrint.id?.slice(-6)}</p>
              <p><strong>DATA:</strong> {new Date(orderToPrint.createdAt).toLocaleString('pt-BR')}</p>
              <p><strong>CLIENTE:</strong> {orderToPrint.customerName}</p>
              <p><strong>CONTATO:</strong> {orderToPrint.phone}</p>
            </div>

            <div className="border-t border-dashed border-black my-2"></div>
            
            <div className="text-[10px] space-y-2">
              {orderToPrint.items.map((item, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.selectedOptions?.map((opt: any) => (
                    <div key={opt.groupName} className="text-[8px] pl-2 font-medium">
                      + {opt.groupName}: {opt.items.join(', ')}
                    </div>
                  ))}
                  {item.observation && (
                    <div className="text-[8px] pl-2 italic">Obs: {item.observation}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            <div className="text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {orderToPrint.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>R$ {orderToPrint.deliveryFee.toFixed(2)}</span>
              </div>
              {orderToPrint.discount && orderToPrint.discount > 0 && (
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>- R$ {orderToPrint.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black/10">
                <span>TOTAL:</span>
                <span>R$ {orderToPrint.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 text-[10px] pt-4 border-t border-dashed border-black">
              <p className="font-bold mb-1 uppercase text-[8px]">Endereço de Entrega:</p>
              <p className="leading-tight">{orderToPrint.address}</p>
            </div>

            <div className="mt-4 text-center text-[8px] font-bold">
              <p>PAGAMENTO: {orderToPrint.paymentMethod.toUpperCase()}</p>
              <p className="mt-2">Sabor de Casa - Comida Caseira com Carinho</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
