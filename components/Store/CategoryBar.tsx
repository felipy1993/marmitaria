
import React from 'react';

interface CategoryBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-16 md:top-20 z-50 shadow-sm shadow-slate-200/50">
      <div className="max-w-6xl mx-auto flex gap-3 overflow-x-auto py-4 no-scrollbar px-4">
        {['Todos', ...categories].map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onSelectCategory(cat)} 
              className={`px-5 py-2 rounded-2xl font-black whitespace-nowrap transition-all text-[11px] uppercase tracking-wider border-2 ${
                isActive 
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-105' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
