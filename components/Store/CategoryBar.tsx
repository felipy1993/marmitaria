
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
    <div className="bg-white border-b border-slate-50 sticky top-16 md:top-20 z-50">
      <div className="max-w-6xl mx-auto flex gap-4 overflow-x-auto py-4 no-scrollbar px-4">
        {['Todos', ...categories].map((cat) => (
          <button 
            key={cat} 
            onClick={() => onSelectCategory(cat)} 
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all text-xs border ${
              selectedCategory === cat 
              ? 'bg-orange-500 text-white border-orange-500' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
