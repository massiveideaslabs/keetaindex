import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from './constants';
import { AppItem, Category, SubmissionData, Report } from './types';
import { AppCard } from './components/AppCard';
import { SubmissionModal } from './components/SubmissionModal';
import { ReportModal } from './components/ReportModal';
import { AdminPanel } from './components/AdminPanel';
import * as dbService from './services/db';

type SortOption = 'NEWEST' | 'ALPHABETICAL' | 'POPULAR' | 'FEATURED';
type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

// Hardcoded admin password
const ADMIN_PASSWORD = "K33TA-S3CR3T-88";

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Data State
  const [activeCategory, setActiveCategory] = useState<Category>(Category.ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('FEATURED');
  
  // App State
  const [apps, setApps] = useState<AppItem[]>([]);
  const [adminApps, setAdminApps] = useState<AppItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Modal State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reportingApp, setReportingApp] = useState<AppItem | null>(null);

  // --- Persistence Effects ---
  const loadData = async () => {
    try {
      setIsLoading(true);
      setDbError(null);
      const [fetchedApps, fetchedReports] = await Promise.all([
        dbService.getApps(),
        dbService.getReports()
      ]);
      setApps(fetchedApps);
      setReports(fetchedReports);
    } catch (error) {
      console.error("Failed to load data:", error);
      setDbError("Could not connect to the backend API. Please check your configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load admin data when entering admin dashboard
  useEffect(() => {
    if (view === 'ADMIN_DASHBOARD') {
      const loadAdminData = async () => {
        try {
          const allApps = await dbService.getAllApps();
          setAdminApps(allApps);
        } catch (error) {
          console.error("Failed to load admin apps:", error);
        }
      };
      loadAdminData();
    }
  }, [view]);

  // --- Logic ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setView('ADMIN_DASHBOARD');
      setLoginError(false);
      setPasswordInput('');
    } else {
      setLoginError(true);
    }
  };

  const handleAppClick = async (id: string) => {
    // Optimistic update
    const app = apps.find(a => a.id === id);
    if (app) {
      const currentClicks = app.clicks || 0;
      setApps(prevApps => 
        prevApps.map(a => 
          a.id === id ? { ...a, clicks: currentClicks + 1 } : a
        )
      );
      // Fire and forget update
      try {
        await dbService.incrementAppClicks(id, currentClicks);
      } catch (err) {
        console.error("Failed to update clicks", err);
      }
    }
  };

  const filteredApps = useMemo(() => {
    // 1. Filter - Only show approved apps on main page
    const filtered = apps.filter(app => {
      // Only show approved apps (safety check in case backend doesn't filter)
      if (!app.approved) return false;
      
      const matchesCategory = activeCategory === Category.ALL || app.category === activeCategory;
      const matchesSearch = 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return b.addedAt - a.addedAt;
      } else if (sortBy === 'POPULAR') {
        return (b.clicks || 0) - (a.clicks || 0);
      } else if (sortBy === 'FEATURED') {
        // If a is featured and b is not, a comes first
        if (!!a.featured !== !!b.featured) {
            return !!a.featured ? -1 : 1;
        }
        // If both match feature status, sort by popularity (clicks)
        return (b.clicks || 0) - (a.clicks || 0);
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }, [apps, activeCategory, searchTerm, sortBy]);

  // --- Actions ---

  const handleSubmission = async (data: SubmissionData) => {
    // Bubble up error so Modal can catch it
    const newApp = await dbService.addApp(data);
    // Don't add to apps list since it's not approved yet
    // It will appear in admin panel for approval
    // Explicitly don't add unapproved apps to the public list
    if (!newApp.approved) {
      // Do nothing - it won't appear until approved
    }
    
    // Reset view
    setActiveCategory(Category.ALL);
    setSearchTerm('');
    setSortBy('NEWEST');
  };

  const handleReportSubmit = async (reasons: string[]) => {
    if (!reportingApp) return;
    try {
      const newReport = await dbService.addReport(reportingApp, reasons);
      setReports(prev => [newReport, ...prev]);
      setReportingApp(null);
    } catch (err) {
      alert("Failed to submit report.");
      console.error(err);
    }
  };

  // --- Admin Actions ---

  const adminDeleteApp = async (id: string) => {
    if(!window.confirm("Are you sure you want to delete this? This cannot be undone.")) return;
    try {
      await dbService.deleteReportsForApp(id); // Delete reports first (due to foreign key)
      await dbService.deleteApp(id);
      setApps(prev => prev.filter(a => a.id !== id));
      setAdminApps(prev => prev.filter(a => a.id !== id));
      setReports(prev => prev.filter(r => r.appId !== id));
    } catch (err) {
      alert("Delete failed: " + (err instanceof Error ? err.message : String(err)));
      console.error("Delete error:", err);
    }
  };
  
  const adminUpdateApp = async (id: string, data: SubmissionData) => {
    try {
      await dbService.updateApp(id, data);
      setApps(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    } catch (err) {
      alert("Update failed");
      console.error(err);
    }
  };

  const adminDismissReport = async (id: string) => {
    try {
      await dbService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Dismiss failed");
      console.error(err);
    }
  };

  const adminToggleFeatured = async (id: string) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;
    const newVal = !app.featured;
    
    // Optimistic
    setApps(prev => prev.map(a => a.id === id ? { ...a, featured: newVal } : a));
    
    try {
      await dbService.updateApp(id, { featured: newVal });
    } catch (err) {
      console.error(err);
      // Revert if failed
      setApps(prev => prev.map(a => a.id === id ? { ...a, featured: !newVal } : a));
    }
  };

  // --- Loading / Error States ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="font-mono text-sm uppercase animate-pulse">Indexing Keeta Repository...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center mb-6 rounded-full">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
        </div>
        <h1 className="text-2xl font-bold uppercase mb-2">Connection Error</h1>
        <p className="text-neutral-600 font-mono mb-8 max-w-md">
          {dbError}
        </p>
        <div className="bg-neutral-100 p-4 font-mono text-xs text-left w-full max-w-md overflow-x-auto">
          <p className="font-bold mb-2">Developer Note:</p>
          <p>Please ensure you have created a <span className="bg-white px-1">.env</span> file with your backend API URL:</p>
          <pre className="mt-2 text-neutral-500">
            VITE_API_URL=http://localhost:3001{'\n'}
            (or your Railway backend URL)
          </pre>
        </div>
      </div>
    );
  }

  // --- Render Views ---

  if (view === 'ADMIN_LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="bg-white p-8 max-w-sm w-full border border-neutral-800">
          <h2 className="text-xl font-bold mb-6 font-mono uppercase">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              className="w-full border border-black p-3 font-mono"
              placeholder="Enter Password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
            />
            {loginError && <p className="text-red-600 text-xs font-mono">Invalid Password</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-black text-white p-3 font-bold uppercase">Login</button>
              <button type="button" onClick={() => setView('HOME')} className="flex-1 bg-white border border-black text-black p-3 font-bold uppercase">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'ADMIN_DASHBOARD') {
    return (
      <AdminPanel 
        apps={adminApps}
        reports={reports}
        onAddApp={handleSubmission}
        onUpdateApp={adminUpdateApp}
        onDeleteApp={adminDeleteApp}
        onDismissReport={adminDismissReport}
        onToggleFeatured={adminToggleFeatured}
        onApproveApp={async (id: string, approved: boolean) => {
          try {
            const updatedApp = await dbService.approveApp(id, approved);
            setAdminApps(prev => prev.map(a => a.id === id ? updatedApp : a));
            // Reload public apps if approving
            if (approved) {
              const publicApps = await dbService.getApps();
              setApps(publicApps);
            }
          } catch (err) {
            alert("Failed to update approval status");
            console.error(err);
          }
        }}
        onExit={() => {
          setView('HOME');
          loadData(); // Reload public apps when exiting admin
        }}
      />
    );
  }

  // --- Main Site View ---

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black"></div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">Keeta<span className="font-light">.Dev</span></h1>
          </div>
          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="text-sm font-mono font-bold uppercase border-l border-black pl-6 hover:underline underline-offset-4"
          >
            Submit Project [+]
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 md:px-8 py-20 md:py-32 border-b border-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-8">
            THE INDEX FOR<br/>
            THE FUTURE OF<br/>
            FINANCE
          </h2>
          <p className="text-xl md:text-2xl text-neutral-600 max-w-2xl font-light leading-tight">
            Discover the decentralized applications, tools, and infrastructure building the Keeta ecosystem.
          </p>
          <p className="mt-8 text-xs text-neutral-400 font-mono max-w-2xl leading-relaxed uppercase">
            DISCLAIMER: Keeta.Dev is an independent, community-maintained directory and is not affiliated with or endorsed by Keeta or its affiliates. We do not endorse, audit or verify the security of indexed applications. Users engage with third-party projects entirely at their own risk; we assume no liability for any loss of funds or damages. For official news and information about Keeta, please visit the official site at www.keeta.com.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b border-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            
            {/* Category Scroll */}
            <div className="overflow-x-auto pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      px-4 py-2 text-sm font-mono uppercase whitespace-nowrap border transition-all
                      ${activeCategory === cat 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-black border-neutral-200 hover:border-black'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls: Sort & Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none w-full sm:w-40 h-full bg-neutral-50 border border-neutral-200 py-2 pl-3 pr-8 text-sm font-mono uppercase focus:border-black focus:outline-none cursor-pointer hover:border-black transition-colors"
                >
                  <option value="FEATURED">Featured</option>
                  <option value="NEWEST">Newest Added</option>
                  <option value="POPULAR">Most Popular</option>
                  <option value="ALPHABETICAL">Alphabetical</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="SEARCH DIRECTORY..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-2 pl-2 pr-8 text-sm font-mono uppercase focus:border-black focus:outline-none placeholder:text-neutral-400"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-12 w-full">
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-black border border-black">
            {/* Gap of 1px with bg-black creates the grid lines effect if cards have bg-white */}
            {filteredApps.map(app => (
              <div key={app.id} className="bg-white h-full">
                 <AppCard 
                   app={app} 
                   onClick={() => handleAppClick(app.id)} 
                   onReport={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setReportingApp(app);
                   }}
                 />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-neutral-300">
            <p className="text-neutral-400 font-mono uppercase">
              {apps.length === 0 ? "Database Empty. Submit a project to get started." : "No projects found matching your criteria."}
            </p>
            {apps.length > 0 && (
              <button 
                onClick={() => {setActiveCategory(Category.ALL); setSearchTerm('')}}
                className="mt-4 text-sm font-bold underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="text-2xl font-bold tracking-tighter uppercase mb-2">Keeta.Dev</div>
            <p className="text-neutral-500 font-mono text-xs max-w-xs">
              Open source directory for the Keeta Blockchain. 
              Community maintained.
            </p>
            <p className="text-neutral-500 font-mono text-xs max-w-xs mt-4 break-all">
              For donations: keeta_aabb4pypre2ybzfparh2ruvatpvf5dsj5qi35xjd3wcyp46gxrx7rh6gmaxuuua
            </p>
          </div>
          <div className="flex gap-6 text-sm font-mono text-neutral-400 items-center">
            <button onClick={() => setView('ADMIN_LOGIN')} className="hover:text-white transition-colors uppercase">Admin</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubmissionModal 
        isOpen={isSubmitOpen} 
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmission}
      />
      
      <ReportModal 
        isOpen={!!reportingApp}
        app={reportingApp}
        onClose={() => setReportingApp(null)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}

export default App;