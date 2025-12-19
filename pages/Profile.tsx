import React, { useEffect, useState } from 'react';
import { UserProfile, ContentItem, ContentStatus, ClientPayment } from '../types';
import { db } from '../services/database';
import { User, CreditCard, Clock, Download, ChevronRight, Settings, Check, FileText, ExternalLink, Eye, X, Plus, Save, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<ContentItem[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'BILLING' | 'HISTORY'>('DETAILS');
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserProfile>>({});
  const [newTopic, setNewTopic] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const u = await db.getUser();
      setUser(u);
      if (u) {
        setEditedUser(u);
        const h = await db.getPromptHistory(u.id);
        setHistory(h);
        const allPayments = await db.getClientPayments();
        setPayments(allPayments.filter(p => p.userId === u.id));
      }
    };
    load();
  }, []);

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel: Reset editedUser to current user
      setEditedUser(user || {});
    }
    setIsEditing(!isEditing);
  };

  const handleSaveDetails = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await db.updateUser(editedUser);
      setUser(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Error saving profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      const currentExpertise = editedUser.expertise || [];
      setEditedUser({ ...editedUser, expertise: [...currentExpertise, newTopic.trim()] });
      setNewTopic("");
    }
  };

  const removeTopic = (topicToRemove: string) => {
    const currentExpertise = editedUser.expertise || [];
    setEditedUser({ ...editedUser, expertise: currentExpertise.filter(t => t !== topicToRemove) });
  };

  const handleManageSubscription = () => {
      alert("Redirecting to Stripe Customer Portal...");
  };

  const handleViewAssets = (id: string) => {
      navigate(`/review/${id}`);
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading profile data...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="col-span-12 md:col-span-3 space-y-2">
          <button 
            onClick={() => { setActiveTab('DETAILS'); setIsEditing(false); }} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'DETAILS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <User size={18} /> Account Details
          </button>
          <button 
            onClick={() => { setActiveTab('BILLING'); setIsEditing(false); }} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'BILLING' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <CreditCard size={18} /> Billing & Plan
          </button>
          <button 
            onClick={() => { setActiveTab('HISTORY'); setIsEditing(false); }} 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Clock size={18} /> Prompt History
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-12 md:col-span-9 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm min-h-[500px]">
           
           {activeTab === 'DETAILS' && (
             <div className="space-y-6 animate-fade-in">
               <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                 {user.brandLogoUrl ? (
                    <img src={user.brandLogoUrl} alt="Brand" className="w-20 h-20 object-contain border border-slate-100 rounded-xl p-2 bg-slate-50" />
                 ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <User size={32} />
                    </div>
                 )}
                 <div className="text-center sm:text-left flex-1">
                   <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                   <p className="text-slate-500 font-medium">{user.role}</p>
                   <p className="text-slate-400 text-sm mt-1">{user.industry}</p>
                 </div>
                 {!isEditing ? (
                   <button 
                    onClick={handleToggleEdit}
                    className="text-tv-teal font-bold text-sm hover:underline flex items-center gap-1"
                   >
                     Edit Details
                   </button>
                 ) : (
                   <div className="flex gap-2">
                      <button onClick={handleToggleEdit} className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                      <button 
                        onClick={handleSaveDetails} 
                        disabled={isSaving}
                        className="bg-tv-teal text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                      </button>
                   </div>
                 )}
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Full Name</label>
                   {isEditing ? (
                     <input 
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                      value={editedUser.name || ""}
                      onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                     />
                   ) : (
                     <div className="w-full p-3 bg-slate-50 rounded-lg text-slate-700 font-medium border border-slate-100">{user.name}</div>
                   )}
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Professional Role</label>
                   {isEditing ? (
                     <input 
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                      value={editedUser.role || ""}
                      onChange={e => setEditedUser({...editedUser, role: e.target.value})}
                     />
                   ) : (
                     <div className="w-full p-3 bg-slate-50 rounded-lg text-slate-700 font-medium border border-slate-100">{user.role}</div>
                   )}
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label>
                   {isEditing ? (
                     <input 
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                      value={editedUser.contact?.primary.email || ""}
                      onChange={e => setEditedUser({
                        ...editedUser, 
                        contact: { ...editedUser.contact!, primary: { ...editedUser.contact!.primary, email: e.target.value } }
                      })}
                     />
                   ) : (
                     <div className="w-full p-3 bg-slate-50 rounded-lg text-slate-700 font-medium border border-slate-100">{user.contact.primary.email}</div>
                   )}
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phone</label>
                   {isEditing ? (
                     <input 
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                      value={editedUser.contact?.primary.phone || ""}
                      onChange={e => setEditedUser({
                        ...editedUser, 
                        contact: { ...editedUser.contact!, primary: { ...editedUser.contact!.primary, phone: e.target.value } }
                      })}
                     />
                   ) : (
                     <div className="w-full p-3 bg-slate-50 rounded-lg text-slate-700 font-medium border border-slate-100">{user.contact.primary.phone || 'N/A'}</div>
                   )}
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Expertise Topics</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {(isEditing ? (editedUser.expertise || []) : user.expertise).map(t => (
                       <span key={t} className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-sm font-medium flex items-center gap-2">
                           {t}
                           {isEditing && (
                             <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => removeTopic(t)} />
                           )}
                       </span>
                   ))}
                 </div>
                 {isEditing && (
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Add industry expertise..." 
                        className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none text-sm"
                        value={newTopic}
                        onChange={e => setNewTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTopic()}
                     />
                     <button onClick={addTopic} className="px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"><Plus size={20} /></button>
                   </div>
                 )}
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Communication Style</label>
                        {isEditing ? (
                          <select 
                            className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                            value={editedUser.toneStyle || "Professional"}
                            onChange={e => setEditedUser({...editedUser, toneStyle: e.target.value})}
                          >
                             {['Professional', 'Casual', 'Authoritative', 'Empathetic', 'Controversial', 'Educational'].map(t => (
                               <option key={t} value={t}>{t}</option>
                             ))}
                          </select>
                        ) : (
                          <div className="text-sm font-bold text-slate-900">{user.toneStyle || 'Professional'}</div>
                        )}
                   </div>
                   <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Website</label>
                        {isEditing ? (
                          <input 
                            className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-tv-teal outline-none transition-all"
                            value={editedUser.website || ""}
                            onChange={e => setEditedUser({...editedUser, website: e.target.value})}
                            placeholder="company.com"
                          />
                        ) : (
                          <a href={`https://${user.website}`} target="_blank" rel="noreferrer" className="text-sm text-tv-teal hover:underline truncate block">{user.website}</a>
                        )}
                   </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                   <h4 className="font-bold text-slate-900 mb-3 text-sm">Review Team</h4>
                   {user.reviewer.mode === 'SELF' ? (
                       <div className="text-slate-500 text-sm">Self-Review Only</div>
                   ) : (
                       <div className="space-y-2">
                           {user.reviewer.teamMembers.map((m, i) => (
                               <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                   <span className="font-medium text-slate-800">{m.name}</span>
                                   <span className="text-slate-500">{m.email}</span>
                               </div>
                           ))}
                       </div>
                   )}
                   {isEditing && (
                     <p className="text-[10px] text-slate-400 mt-3 italic">Note: Review team settings must be adjusted by your Account Manager via the Staff Portal.</p>
                   )}
               </div>

               {isEditing && (
                 <div className="pt-8 flex justify-end gap-4 border-t border-slate-100">
                    <button onClick={handleToggleEdit} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Discard Changes</button>
                    <button 
                      onClick={handleSaveDetails} 
                      disabled={isSaving}
                      className="bg-tv-teal text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center gap-2"
                    >
                      {isSaving ? <RotateCcw className="animate-spin" size={18} /> : <Check size={18} />} Save All Changes
                    </button>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'BILLING' && (
             <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-tv-teal opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                   <div className="flex justify-between items-start relative z-10">
                       <div>
                          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Current Plan</div>
                          <div className="text-3xl font-bold text-white mb-2">{user.plan}</div>
                          <div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/30">
                             <Check size={12} /> ACTIVE
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-3xl font-bold text-white">{user.plan === 'PRO' ? '$999' : user.plan === 'ENTERPRISE' ? '$2,499' : '$499'}</div>
                          <div className="text-sm text-slate-400">/month</div>
                       </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-6 text-sm text-slate-300">
                      <div>
                         <span className="block font-bold text-white">Next Billing</span>
                         <span>Oct 14, 2023</span>
                      </div>
                      <div>
                         <span className="block font-bold text-white">Payment Method</span>
                         <span>Visa ending 4242</span>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleManageSubscription} className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                      <Settings size={18} /> Manage Subscription
                  </button>
                </div>

                <div>
                   <h3 className="font-bold text-slate-900 mb-4">Payment History</h3>
                   <div className="border border-slate-200 rounded-xl overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-slate-50 text-slate-500 font-medium">
                                   <tr>
                                       <th className="p-3">Date</th>
                                       <th className="p-3">Amount</th>
                                       <th className="p-3">Status</th>
                                       <th className="p-3 text-right">Invoice</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {payments.length === 0 ? (
                                       <tr><td colSpan={4} className="p-4 text-center text-slate-400">No payment history found.</td></tr>
                                   ) : (
                                       payments.map(pay => (
                                           <tr key={pay.id} className="hover:bg-slate-50">
                                               <td className="p-3">{new Date(pay.date).toLocaleDateString()}</td>
                                               <td className="p-3 font-bold">${pay.amount}</td>
                                               <td className="p-3">
                                                   <span className={`px-2 py-1 rounded text-[10px] font-bold ${pay.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                       {pay.status}
                                                   </span>
                                               </td>
                                               <td className="p-3 text-right">
                                                   <button className="text-tv-teal hover:underline flex items-center justify-end gap-1 ml-auto">
                                                       <FileText size={14} /> PDF
                                                   </button>
                                               </td>
                                           </tr>
                                       ))
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'HISTORY' && (
             <div className="animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-4 pl-2">Date</th>
                        <th className="pb-4">Content Title</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {history.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-4 pl-2 text-sm text-slate-500 font-medium">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 font-bold text-slate-900">{item.title}</td>
                            <td className="py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                                item.status === ContentStatus.PUBLISHED ? 'bg-green-100 text-green-700' : 
                                item.status === ContentStatus.APPROVED ? 'bg-blue-100 text-blue-700' :
                                item.status === ContentStatus.READY_FOR_REVIEW ? 'bg-indigo-100 text-indigo-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {item.status.replace(/_/g, ' ')}
                            </span>
                            </td>
                            <td className="py-4 text-right pr-2">
                            {(item.status === ContentStatus.PUBLISHED || item.status === ContentStatus.APPROVED || item.status === ContentStatus.READY_FOR_REVIEW) ? (
                                <button 
                                    onClick={() => handleViewAssets(item.id)}
                                    className="text-tv-teal hover:text-teal-700 text-xs font-bold inline-flex items-center gap-1 justify-end px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                                >
                                    <Eye size={14} /> View Assets
                                </button>
                            ) : (
                                <span className="text-slate-300 text-xs italic">Processing</span>
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                {history.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Clock size={32} />
                        </div>
                        <div className="text-slate-400 font-medium">No history available yet.</div>
                    </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
