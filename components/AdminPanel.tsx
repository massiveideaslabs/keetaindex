import React, { useState, useMemo } from 'react';
import { AppItem, Report, Category, SubmissionData } from '../types';
import { CATEGORIES } from '../constants';

type AdminSortOption = 'NEWEST' | 'ALPHABETICAL' | 'POPULAR' | 'FEATURED' | 'REPORTED';

interface AdminPanelProps {
  apps: AppItem[];
  reports: Report[];
  onDeleteApp: (id: string) => void;
  onAddApp: (data: SubmissionData) => void;
  onUpdateApp: (id: string, data: SubmissionData) => void;
  onDismissReport: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onApproveApp: (id: string, approved: boolean) => Promise<void>;
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  apps, 
  reports, 
  onDeleteApp, 
  onAddApp, 
  onUpdateApp,
  onDismissReport,
  onToggleFeatured,
  onApproveApp,
  onExit 
}) => {
  const [activeTab, setActiveTab] = useState<'APPS' | 'REPORTS' | 'PENDING'>('PENDING');
  const [sortBy, setSortBy] = useState<AdminSortOption>('NEWEST');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubmissionData>({
    name: '', description: '', url: '', category: Category.DEFI
  });

  const reportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.appId] = (counts[r.appId] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const pendingApps = useMemo(() => {
    return apps.filter(app => !app.approved).sort((a, b) => b.addedAt - a.addedAt);
  }, [apps]);

  const approvedApps = useMemo(() => {
    return apps.filter(app => app.approved);
  }, [apps]);

  const sortedApps = useMemo(() => {
    const appsToSort = activeTab === 'APPS' ? approvedApps : apps;
    return [...appsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'NEWEST': 
          return b.addedAt - a.addedAt;
        case 'ALPHABETICAL': 
          return a.name.localeCompare(b.name);
        case 'POPULAR': 
          return (b.clicks || 0) - (a.clicks || 0);
        case 'FEATURED':
          if (!!a.featured !== !!b.featured) {
            return !!a.featured ? -1 : 1;
          }
          return (b.clicks || 0) - (a.clicks || 0);
        case 'REPORTED':
          const countA = reportCounts[a.id] || 0;
          const countB = reportCounts[b.id] || 0;
          if (countA !== countB) return countB - countA;
          return (b.clicks || 0) - (a.clicks || 0);
        default: 
          return 0;
      }
    });
  }, [apps, sortBy, reportCounts]);

  const handleEditClick = (app: AppItem) => {
    setFormData({
      name: app.name,
      description: app.description,
      url: app.url,
      category: app.category
    });
    setEditingId(app.id);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setFormData({ name: '', description: '', url: '', category: Category.DEFI });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateApp(editingId, formData);
    } else {
      onAddApp(formData);
    }
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', url: '', category: Category.DEFI });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono uppercase bg-black text-white px-4 py-2">
            Keeta.Dev // Admin Console
          </h1>
          <button onClick={onExit} className="text-sm font-bold underline hover:text-red-600">
            LOGOUT
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-black pb-1">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`text-lg font-bold font-mono uppercase px-4 py-2 ${activeTab === 'PENDING' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-200'}`}
          >
            Pending Approval <span className="bg-yellow-600 text-white px-2 py-0.5 ml-1 text-sm rounded-full">{apps.filter(a => !a.approved).length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('APPS')}
            className={`text-lg font-bold font-mono uppercase px-4 py-2 ${activeTab === 'APPS' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-200'}`}
          >
            Manage Apps ({apps.filter(a => a.approved).length})
          </button>
          <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`text-lg font-bold font-mono uppercase px-4 py-2 ${activeTab === 'REPORTS' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-200'}`}
          >
            Reports <span className="bg-red-600 text-white px-2 py-0.5 ml-1 text-sm rounded-full">{reports.length}</span>
          </button>
        </div>

        {activeTab === 'PENDING' && (
          <div className="bg-white border border-black p-6 shadow-lg">
            <h3 className="font-bold uppercase mb-6">Pending Submissions ({pendingApps.length})</h3>
            {pendingApps.length === 0 ? (
              <p className="text-neutral-500 font-mono italic">No pending submissions. All clear!</p>
            ) : (
              <div className="space-y-4">
                {pendingApps.map(app => (
                  <div key={app.id} className="border border-yellow-300 bg-yellow-50 p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">{app.name}</span>
                        <span className="text-xs font-mono text-neutral-500 bg-white px-2 py-1 rounded">{app.category}</span>
                      </div>
                      <p className="text-sm text-neutral-700 mb-2">{app.description}</p>
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-mono">
                        {app.url}
                      </a>
                      <p className="text-xs text-neutral-500 font-mono mt-2">
                        Submitted: {new Date(app.addedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button 
                        onClick={async () => {
                          await onApproveApp(app.id, true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onDeleteApp(app.id)}
                        className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'APPS' && (
          <div className="bg-white border border-black p-6 shadow-lg">
            {!isFormOpen ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold uppercase">All Listings</h3>
                  <div className="flex gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as AdminSortOption)}
                      className="border border-black px-2 py-2 font-mono text-xs uppercase bg-white cursor-pointer hover:bg-neutral-50 focus:outline-none"
                    >
                      <option value="NEWEST">Newest</option>
                      <option value="POPULAR">Popular</option>
                      <option value="FEATURED">Featured</option>
                      <option value="ALPHABETICAL">Alphabetical</option>
                      <option value="REPORTED">Reported ({reports.length > 0 ? reports.length : '0'})</option>
                    </select>
                    <button 
                      onClick={handleAddNewClick}
                      className="bg-green-600 text-white px-4 py-2 font-mono text-sm font-bold hover:bg-green-700 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      + ADD NEW LISTING
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500">Name</th>
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500">Category</th>
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500 text-center">Featured</th>
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500">Clicks</th>
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500 text-center">Approved</th>
                        <th className="p-3 font-mono text-xs uppercase text-neutral-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedApps.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-neutral-400 font-mono">
                            {activeTab === 'APPS' ? 'No approved apps. Approve submissions in the Pending tab.' : 'Database is empty. Add a listing to get started.'}
                          </td>
                        </tr>
                      ) : sortedApps.map(app => {
                        const rCount = reportCounts[app.id] || 0;
                        return (
                          <tr key={app.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{app.name}</span>
                                    {rCount > 0 && (
                                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono" title={`${rCount} Reports`}>
                                            {rCount} !
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-3 font-mono text-sm">{app.category}</td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={!!app.featured} 
                                onChange={() => onToggleFeatured(app.id)}
                                className="w-5 h-5 accent-black cursor-pointer border-black"
                              />
                            </td>
                            <td className="p-3 font-mono text-sm">{app.clicks || 0}</td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={!!app.approved} 
                                onChange={() => onApproveApp(app.id, !app.approved)}
                                className="w-5 h-5 accent-black cursor-pointer border-black"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleEditClick(app)}
                                  className="text-black font-bold text-xs font-mono border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
                                >
                                  EDIT
                                </button>
                                <button 
                                  onClick={() => onDeleteApp(app.id)}
                                  className="text-red-600 font-bold text-xs font-mono border border-red-600 px-2 py-1 hover:bg-red-600 hover:text-white transition-colors"
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold uppercase">{editingId ? 'Edit Listing' : 'Add New Listing'}</h3>
                  <button onClick={() => setIsFormOpen(false)} className="text-sm underline">Cancel</button>
                </div>
                <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
                  <input 
                    required placeholder="App Name" className="w-full border border-black p-2"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <select 
                    className="w-full border border-black p-2 bg-white"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  >
                     {CATEGORIES.filter(c => c !== Category.ALL).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input 
                    required type="url" placeholder="URL" className="w-full border border-black p-2"
                    value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})}
                  />
                  <textarea 
                    required placeholder="Description" rows={3} className="w-full border border-black p-2"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                  <button type="submit" className="bg-black text-white px-6 py-2 font-bold uppercase">
                    {editingId ? 'Update Listing' : 'Create Listing'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'REPORTS' && (
          <div className="bg-white border border-black p-6 shadow-lg">
             <h3 className="font-bold uppercase mb-6">User Reports</h3>
             {reports.length === 0 ? (
               <p className="text-neutral-500 font-mono italic">No active reports. Good job!</p>
             ) : (
               <div className="space-y-4">
                 {reports.map(report => (
                   <div key={report.id} className="border border-red-200 bg-red-50 p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{report.appName}</span>
                          <span className="text-xs font-mono text-neutral-500">{new Date(report.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.reasons.map(r => (
                            <span key={r} className="bg-white border border-red-200 px-2 py-1 text-xs text-red-700 font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => onDeleteApp(report.appId)}
                          className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase hover:bg-red-700"
                        >
                          Ban App
                        </button>
                        <button 
                          onClick={() => onDismissReport(report.id)}
                          className="bg-white border border-neutral-300 px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-100"
                        >
                          Dismiss
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};