
import React from 'react';
import { Product } from '../../types';

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
      onClick={() => onClick(product)}
      className={`bg-white p-4 rounded-xl border border-slate-100 transition-all flex gap-4 group ${
        isStoreOpen 
          ? 'hover:border-slate-200 hover:shadow-sm cursor-pointer' 
          : 'opacity-60 cursor-not-allowed grayscale-[0.5]'
      }`}
    >
      <div className="flex-1 space-y-2">
        <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors">{product.name}</h3>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 font-medium">{product.description}</p>
        <p className="text-slate-800 font-bold text-sm pt-1">
          <span className="text-orange-600 font-medium mr-0.5">R$</span> {product.price.toFixed(2)}
        </p>
      </div>
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
      </div>
    </div>
  );
};

export default ProductCard;
