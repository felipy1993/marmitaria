
import React from 'react';
import { Product } from '../../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isStoreOpen: boolean;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isStoreOpen,
  onClick
}) => {
  return (
    <div 
      onClick={() => isStoreOpen && onClick(product)}
      className={`bg-white p-4 rounded-3xl border border-slate-100 transition-all flex gap-4 group relative overflow-hidden ${
        isStoreOpen 
          ? 'hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer active:scale-[0.98]' 
          : 'opacity-70 cursor-not-allowed grayscale-[0.3]'
      }`}
    >
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-800 leading-tight group-hover:text-orange-500 transition-colors">
            {product.name}
          </h3>
          <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 font-medium">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="text-slate-900 font-extrabold text-base">
            <span className="text-orange-500 text-xs font-bold mr-0.5">R$</span>
            {product.price.toFixed(2)}
          </p>
          
          {isStoreOpen && (
            <div className="bg-orange-50 text-orange-500 p-1.5 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:rotate-90">
              <Plus size={18} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shrink-0 relative shadow-sm">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {!isStoreOpen && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] font-black text-white uppercase tracking-wider bg-slate-900/60 px-2 py-1 rounded-lg">Indisponível</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
