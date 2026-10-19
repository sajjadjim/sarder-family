import React from 'react';
import { LanguageProvider, FamilyDataProvider, TreeStateProvider, useLanguage, useFamilyData } from './contexts/AppContext';
import Header from './components/Header';
import FamilyTree from './components/FamilyTree';
import ProfilePanel from './components/ProfilePanel';

// ── Hero section shown above the tree ────────────────────────────────────────
const Hero: React.FC = () => {
  const { t } = useLanguage();
  const { data } = useFamilyData();

  const totalMembers = data?.people.size ?? 0;
  const isSample = true; // Flip to false once real data is loaded

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-800 to-forest-700 text-white">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaves" patternUnits="userSpaceOnUse" width="40" height="40">
              <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="0.5" />
              <line x1="20" y1="12" x2="20" y2="28" stroke="white" strokeWidth="0.5" />
              <line x1="12" y1="20" x2="28" y2="20" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)" />
        </svg>
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12 sm:py-16 text-center">
        {/* Family name */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-gold-300 text-sm font-medium mb-6 font-bengali">
          <span aria-hidden="true">🌿</span>
          <span lang="bn">সরদার গোষ্ঠী</span>
          <span aria-hidden="true" className="text-white/40">·</span>
          <span lang="en">Sardar Family</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight font-bengali" lang="bn">
          {t('আমাদের শিকড়, আমাদের পরিচয়', 'Our roots, our identity')}
        </h2>

        <p className="text-forest-200 text-base sm:text-lg mb-6 leading-relaxed max-w-xl mx-auto">
          {t(
            'পারিবারিক ইতিহাস সংরক্ষণ ও আগামী প্রজন্মের কাছে তুলে ধরার একটি প্রয়াস। পরিবারের যেকোনো সদস্যের কার্ডে ক্লিক করুন এবং পরবর্তী প্রজন্ম আবিষ্কার করুন।',
            'A journey through our shared heritage. Click any family member\'s card to explore the next generation and discover your family connections.'
          )}
        </p>

        {totalMembers > 0 && (
          <div className="flex items-center justify-center gap-6 text-sm text-forest-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalMembers}</div>
              <div>{t('পরিবারের সদস্য', 'Members')}</div>
            </div>
            <div className="w-px h-8 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">4+</div>
              <div>{t('প্রজন্ম', 'Generations')}</div>
            </div>
          </div>
        )}

        {/* Sample data notice */}
        {isSample && (
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-400/30 text-gold-300 text-xs">
            <span aria-hidden="true">⚠️</span>
            {t(
              'এটি একটি নমুনা ডেটাসেট। সমস্ত নাম ও তথ্য কাল্পনিক।',
              'Sample dataset — all names and details are fictional.'
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// ── Loading & Error states ────────────────────────────────────────────────────
const LoadingState: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-stone-400">
      <div className="w-8 h-8 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" aria-hidden="true" />
      <p>{t('পরিবারের তথ্য লোড হচ্ছে...', 'Loading family data...')}</p>
    </div>
  );
};

const ErrorState: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-6 text-center" role="alert">
      <div className="text-4xl" aria-hidden="true">⚠️</div>
      <h2 className="text-lg font-semibold text-stone-800">
        {t('তথ্য লোড করতে সমস্যা হয়েছে', 'Error loading family data')}
      </h2>
      <p className="text-stone-500 text-sm max-w-sm">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-lg bg-forest-600 text-white text-sm hover:bg-forest-700 transition-colors"
      >
        {t('আবার চেষ্টা করুন', 'Try again')}
      </button>
    </div>
  );
};

// ── Main app shell ────────────────────────────────────────────────────────────
const AppShell: React.FC = () => {
  const { loading, error } = useFamilyData();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-ivory-50 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        {t('প্রধান বিষয়বস্তুতে যান', 'Skip to main content')}
      </a>

      <Header />

      <main id="main-content">
        <Hero />

        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8">
          {loading && <LoadingState />}
          {error && <ErrorState message={error} />}
          {!loading && !error && <FamilyTree />}
        </div>
      </main>

      <footer className="border-t border-stone-100 py-6 mt-8 text-center text-xs text-stone-400">
        <p className="font-bengali">
          {t('সরদার গোষ্ঠীর পারিবারিক ইতিহাস', 'Sardar Family Heritage')}
          {' · '}
          {t('সমস্ত নমুনা তথ্য কাল্পনিক', 'All sample data is fictional')}
        </p>
      </footer>

      <ProfilePanel />
    </div>
  );
};

// ── Root with all providers ───────────────────────────────────────────────────
function App() {
  return (
    <LanguageProvider>
      <FamilyDataProvider>
        <TreeStateProvider>
          <AppShell />
        </TreeStateProvider>
      </FamilyDataProvider>
    </LanguageProvider>
  );
}

export default App;
