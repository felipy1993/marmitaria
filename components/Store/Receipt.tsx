
import React from 'react';
import { Order } from '../../types';

interface ReceiptProps {
  activeOrder: Order | null;
}

const Receipt: React.FC<ReceiptProps> = ({ activeOrder }) => {
  if (!activeOrder) return null;

  return (
    <div className="print-receipt hidden print:block">
      <div className="text-center font-bold text-lg mb-2">MARMITA EXPRESS</div>
      <div className="text-center text-xs mb-4">COMPROVANTE DE PEDIDO</div>
      <div className="text-[10px] mb-2">
        ID: #{activeOrder.id?.slice(-6)}<br/>
        Data: {new Date(activeOrder.createdAt).toLocaleString('pt-BR')}<br/>
        Cliente: {activeOrder.customerName}<br/>
        Whats: {activeOrder.phone}<br/>
      </div>
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="text-[10px]">
        {activeOrder.items.map((item, idx) => (
           <div key={idx} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
           </div>
        ))}
      </div>
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="text-[10px] space-y-1">
        <div className="flex justify-between"><span>Subtotal:</span><span>R$ {activeOrder.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Entrega:</span><span>R$ {activeOrder.deliveryFee.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Desconto:</span><span>- R$ {activeOrder.discount?.toFixed(2) || '0.00'}</span></div>
        <div className="flex justify-between font-bold text-xs pt-1"><span>TOTAL:</span><span>R$ {activeOrder.total.toFixed(2)}</span></div>
      </div>
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="text-[10px]">
        Endereço: {activeOrder.address}
      </div>
      <div className="text-[10px] mt-4 text-center">
        Obrigado pela preferência!
      </div>
    </div>
  );
};

export default Receipt;
