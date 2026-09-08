import React, { useState } from 'react';
import { Book, StoreSettings } from '../types';
import {
  X,
  BookOpen,
  Layers,
  Flame,
  Bookmark,
  GraduationCap,
  Heart,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Award,
  PenTool,
  BookMarked,
  Sparkles,
} from 'lucide-react';

interface CategoryDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  settings: StoreSettings;
}

interface CategoryGroup {
  id: 'all' | 'school' | 'exam' | 'general';
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'all', label: 'All Categories', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'school', label: '🎓 School & Board (Classes 1-12)', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'exam', label: '🏆 Competitive Exams (WBP, WBCS, TET)', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'general', label: '📚 Combos, Islamic & Kits', icon: <Flame className="w-3.5 h-3.5" /> },
];

// Presets with enhanced metadata
const PRESET_CATEGORIES: { name: string; subtitle: string; group: 'school' | 'exam' | 'general'; icon: React.ReactNode; color: string }[] = [
  // School & Board
  { name: 'Class 1-5 (Primary)', subtitle: 'Primary School Textbooks, Workbooks & Guides', group: 'school', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Class 6-8 (Upper Primary)', subtitle: 'Upper Primary Subject Solution Books & Notes', group: 'school', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-teal-100 text-teal-700' },
  { name: 'Class 9-10 (Madhyamik)', subtitle: 'Madhyamik Board All Subjects Guides & Suggestions', group: 'school', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { name: 'Class 11-12 (HS)', subtitle: 'Higher Secondary Science, Arts & Commerce Study Materials', group: 'school', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' },
  { name: 'College & University', subtitle: 'Degree, Honours, Pass & Reference Textbooks', group: 'school', icon: <BookOpen className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },

  // Competitive Exams
  { name: 'WBP & Police Exam', subtitle: 'WB Police & Kolkata Police Constable / SI Exam Guides', group: 'exam', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-800' },
  { name: 'WBCS & PSC Exam', subtitle: 'WBCS Executive & WBPSC Govt Service Exam Books', group: 'exam', icon: <BookMarked className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-800' },
  { name: 'Primary TET & Teaching', subtitle: 'Primary & Upper Primary TET, CTET & Pedagogy', group: 'exam', icon: <Award className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800' },
  { name: 'Railway & SSC Exam', subtitle: 'Railway NTPC/Group D & SSC CGL/CHSL/MTS Preparation', group: 'exam', icon: <Sparkles className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800' },
  { name: 'Nursing & Health Exam', subtitle: 'ANM / GNM Nursing & Healthcare Entrance Exams', group: 'exam', icon: <Heart className="w-4 h-4" />, color: 'bg-rose-100 text-rose-800' },

  // Combos & General
  { name: 'Combo Packs & Sets', subtitle: 'Special Value Multi-Book Bundles & Discount Sets', group: 'general', icon: <Flame className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  { name: 'Stationery & Study Kit', subtitle: 'Notebooks, Pens, Geometry Boxes & Study Accessories', group: 'general', icon: <PenTool className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700' },
  { name: 'Islamic Books', subtitle: 'Quran, Hadith, Seerah, Duas & Islamic Knowledge', group: 'general', icon: <Bookmark className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Literature & Novels', subtitle: 'Classic Masterpieces, Novels, Stories & Poetry', group: 'general', icon: <BookOpen className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  { name: 'Self-Help & Motivation', subtitle: 'Personal Development, Career Success & Mindset', group: 'general', icon: <Heart className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700' },
];

export const CategoryDrawerModal: React.FC<CategoryDrawerModalProps> = ({
  isOpen,
  onClose,
  books,
  selectedCategory,
  onSelectCategory,
  settings,
}) => {
  const [activeGroup, setActiveGroup] = useState<'all' | 'school' | 'exam' | 'general'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Extract all categories dynamically from store books
  const categoryCountMap = new Map<string, number>();
  (books || []).forEach((b) => {
    const cat = (b.category || 'General').trim();
    categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
  });

  // Merge presets with existing store categories
  const allCategoriesToDisplay = PRESET_CATEGORIES.map((preset) => {
    // Find matching count in books
    let count = 0;
    categoryCountMap.forEach((cnt, cat) => {
      if (
        cat.toLowerCase().includes(preset.name.toLowerCase()) ||
        preset.name.toLowerCase().includes(cat.toLowerCase())
      ) {
        count += cnt;
      }
    });

    if (preset.name === 'Combo Packs & Sets') {
      const comboBooksCount = books.filter(
        (b) => b.isCombo || b.category?.toLowerCase().includes('combo')
      ).length;
      if (comboBooksCount > count) count = comboBooksCount;
    }

    return {
      ...preset,
      count,
    };
  });

  // Filter based on active tab & search query
  const filteredCategories = allCategoriesToDisplay.filter((cat) => {
    const matchesGroup = activeGroup === 'all' || cat.group === activeGroup;
    const matchesSearch =
      searchTerm.trim() === '' ||
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handlePickCategory = (cat: string | null) => {
    onSelectCategory(cat);
    onClose();
  };

  return (
    <div
      id="category-menu-modal"
      className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: settings.accentColor || '#FF5722' }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-black leading-tight"
                  style={{ color: settings.primaryColor || '#0B1B3D' }}
                >
                  Book Categories & Classes
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Browse books by academic classes, exams & specialized genres
                </p>
              </div>
            </div>

            <button
              id="close-category-drawer-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close category modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search class, exam (e.g. Madhyamik, WBP, TET)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Category Group Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {CATEGORY_GROUPS.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setActiveGroup(grp.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeGroup === grp.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {/* 1. All Books Option */}
          {activeGroup === 'all' && !searchTerm && (
            <button
              type="button"
              onClick={() => handlePickCategory(null)}
              className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                selectedCategory === null
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedCategory === null ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black block">All Books</span>
                  <span
                    className={`text-xs ${
                      selectedCategory === null ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    View complete library collection
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === null ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {books.length} Books
                </span>
                {selectedCategory === null && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            </button>
          )}

          {/* Filtered Category Items */}
          {filteredCategories.map((cat) => {
            const isSelected =
              selectedCategory?.toLowerCase().includes(cat.name.toLowerCase()) ||
              cat.name.toLowerCase().includes(selectedCategory?.toLowerCase() || '');

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handlePickCategory(cat.name)}
                className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-orange-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : cat.color || 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black block truncate">{cat.name}</span>
                    <span
                      className={`text-xs truncate block ${
                        isSelected ? 'text-slate-300' : 'text-slate-500 font-medium'
                      }`}
                    >
                      {cat.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cat.count}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

