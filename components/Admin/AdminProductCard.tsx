
import React from 'react';
import { Product } from '../../types';
import { Edit2, Copy, Trash2, Settings2 } from 'lucide-react';

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleActive: (product: Product) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ 
  product, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleActive 
}) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="h-44 relative">
        <img 
          src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${!product.active && 'grayscale brightness-50'}`} 
        />
        <button 
          onClick={() => onToggleActive(product)}
          className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all ${product.active ? 'bg-green-500 text-white' : 'bg-slate-700 text-white opacity-90'}`}
        >
          {product.active ? 'No Cardápio' : 'Fora do Ar'}
        </button>
        {product.optionsGroups && product.optionsGroups.length > 0 && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white p-2 rounded-xl shadow-lg">
            <Settings2 size={16} />
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div className="min-h-[64px]">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-2 py-0.5 bg-orange-50 rounded-lg">{product.category}</span>
          <h3 className="font-black text-slate-900 leading-tight mb-1 group-hover:text-orange-600 transition-colors truncate mt-1">{product.name}</h3>
          <p className="text-sm font-black text-slate-900">R$ {product.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex gap-1">
            <button onClick={() => onEdit(product)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
            <button onClick={() => onDuplicate(product)} className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><Copy size={16} /></button>
            <button onClick={() => { if(confirm('Excluir este item?')) onDelete(product.id!); }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductCard;
