import React from 'react';
import { Book, StoreSettings } from '../types';
import {
  Layers,
  GraduationCap,
  ShieldCheck,
  Flame,
  Bookmark,
  BookOpen,
  PenTool,
  Award,
  BookMarked,
  Sparkles,
} from 'lucide-react';

interface CategoryQuickBarProps {
  books: Book[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onOpenCategoryDrawer?: () => void;
  settings: StoreSettings;
}

interface QuickCatItem {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge?: string;
  tagGroup?: 'school' | 'exam' | 'general';
}

const QUICK_CATEGORIES: QuickCatItem[] = [
  {
    id: 'all',
    name: 'All Books',
    shortLabel: 'All Books',
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    id: 'combo',
    name: 'Combo Packs & Sets',
    shortLabel: '🔥 Combo Packs',
    icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
    badge: 'Super Saver',
    tagGroup: 'general',
  },
  {
    id: 'madhyamik',
    name: 'Class 9-10 (Madhyamik)',
    shortLabel: 'Class 9-10 (Madhyamik)',
    icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />,
    tagGroup: 'school',
  },
  {
    id: 'hs',
    name: 'Class 11-12 (HS)',
    shortLabel: 'Class 11-12 (HS)',
    icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />,
    tagGroup: 'school',
  },
  {
    id: 'wbp',
    name: 'WBP & Police Exam',
    shortLabel: 'WBP / KP Police',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'Hot Exam',
    tagGroup: 'exam',
  },
  {
    id: 'tet',
    name: 'Primary TET & Teaching',
    shortLabel: 'Primary TET / CTET',
    icon: <Award className="w-3.5 h-3.5 text-purple-600" />,
    tagGroup: 'exam',
  },
  {
    id: 'wbcs',
    name: 'WBCS & PSC Exam',
    shortLabel: 'WBCS & PSC',
    icon: <BookMarked className="w-3.5 h-3.5 text-cyan-600" />,
    tagGroup: 'exam',
  },
  {
    id: 'stationery',
    name: 'Stationery & Study Kit',
    shortLabel: 'Stationery & Kits',
    icon: <PenTool className="w-3.5 h-3.5 text-rose-500" />,
    tagGroup: 'general',
  },
  {
    id: 'islamic',
    name: 'Islamic Books',
    shortLabel: 'Islamic Books',
    icon: <Bookmark className="w-3.5 h-3.5 text-emerald-600" />,
    tagGroup: 'general',
  },
  {
    id: 'literature',
    name: 'Literature & Novels',
    shortLabel: 'Novels & Literature',
    icon: <BookOpen className="w-3.5 h-3.5 text-amber-600" />,
    tagGroup: 'general',
  },
];

export const CategoryQuickBar: React.FC<CategoryQuickBarProps> = ({
  books,
  selectedCategory,
  onSelectCategory,
  onOpenCategoryDrawer,
  settings,
}) => {
  // Count matching books for each category
  const getCategoryCount = (catName: string) => {
    if (catName === 'All Books') return books.length;
    if (catName === 'Combo Packs & Sets') {
      return books.filter((b) => b.isCombo || b.category?.toLowerCase().includes('combo')).length;
    }
    return books.filter((b) => {
      const bCat = (b.category || '').toLowerCase();
      const bTarget = (b.targetClass || '').toLowerCase();
      const query = catName.toLowerCase();
      return bCat.includes(query) || bTarget.includes(query) || query.includes(bCat);
    }).length;
  };

  const isCatActive = (catItem: QuickCatItem) => {
    if (catItem.id === 'all') return selectedCategory === null;
    if (catItem.id === 'combo') {
      return selectedCategory === 'Combo Packs & Sets' || selectedCategory === 'Combo Offer' || selectedCategory === 'Combo Sets';
    }
    return (
      selectedCategory?.toLowerCase().includes(catItem.name.toLowerCase()) ||
      catItem.name.toLowerCase().includes(selectedCategory?.toLowerCase() || '')
    );
  };

  return (
    <div id="category-quick-bar" className="my-2.5 sm:my-3.5 w-full">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
            Browse by Class & Exams
          </h3>
        </div>
        {onOpenCategoryDrawer && (
          <button
            type="button"
            onClick={onOpenCategoryDrawer}
            className="text-[11px] font-bold text-orange-600 hover:text-orange-800 hover:underline cursor-pointer"
          >
            All Categories →
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Pills */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {QUICK_CATEGORIES.map((item) => {
          const active = isCatActive(item);
          const count = getCategoryCount(item.name);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'all') {
                  onSelectCategory(null);
                } else {
                  onSelectCategory(item.name);
                }
              }}
              className={`snap-start inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs border cursor-pointer shrink-0 ${
                active
                  ? 'text-white border-transparent shadow-md transform scale-[1.02]'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/90'
              }`}
              style={{
                backgroundColor: active ? settings.primaryColor || '#0B1B3D' : undefined,
              }}
            >
              <span className={active ? 'text-white' : ''}>{item.icon}</span>
              <span>{item.shortLabel}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    active ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
