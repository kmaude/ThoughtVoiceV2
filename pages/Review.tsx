import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/database';
import { ContentItem, ContentStatus, Comment } from '../types';
import { Play, Pause, MessageSquare, CheckCircle, XCircle, ArrowLeft, Linkedin, Twitter, FileText, Save, Edit3, Share2, FolderOpen, Mail, Send, Copy, AlignLeft } from 'lucide-react';

export const Review: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeCopyTab, setActiveCopyTab] = useState<'HOOKS' | 'LINKEDIN' | 'TWITTER' | 'BLOG' | 'SCRIPT'>('HOOKS');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  // Editable Content State
  const [linkedInCopy, setLinkedInCopy] = useState("");
  const [twitterCopy, setTwitterCopy] = useState("");
  const [blogCopy, setBlogCopy] = useState("");
  const [scriptCopy, setScriptCopy] = useState("");
  const [hooksCopy, setHooksCopy] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const items = await db.getContent();
      const found = items.find(i => i.id === id);
      if (found) {
        setItem(found);
        if (found.comments) setComments(found.comments);
        // Initialize editable state
        if (found.assets) {
          setLinkedInCopy(found.assets.linkedInPost || "");
          setTwitterCopy(Array.isArray(found.assets.twitterThread) ? found.assets.twitterThread.join('\n\n') : found.assets.twitterThread || "");
          setBlogCopy(found.assets.blogOutline || "");
          setScriptCopy(found.assets.cleanScript || "");
          setHooksCopy(found.assets.hooks || []);
        }
      }
    };
    load();
  }, [id]);

  const handleApprove = async () => {
    if (item && item.assets) {
      const updatedAssets = {
        ...item.assets,
        linkedInPost: linkedInCopy,
        twitterThread: twitterCopy.split('\n\n'),
        blogOutline: blogCopy,
        cleanScript: scriptCopy,
        hooks: hooksCopy
      };
      
      await db.updateContentItem(item.id, { assets: updatedAssets });
      const user = await db.getUser();
      await db.approveContent(item.id, user?.name || "Client");
      
      alert("Content Approved & Published! You can download assets in your Profile.");
      navigate('/profile');
    }
  };

  const handleComment = () => {
    if (!newComment.trim() || !item) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      timestamp: 0, 
      text: newComment,
      author: "Client",
      createdAt: new Date().toISOString()
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    db.updateContentItem(item.id, { comments: updatedComments });
    setNewComment("");
  };

  const handleShare = () => {
      if (shareEmail) {
          alert(`Review link sent to ${shareEmail}`);
          setShowShareModal(false);
          setShareEmail("");
      }
  };

  if (!item) return <div className="p-10 text-center text-slate-500">Loading Review Interface...</div>;

  return (
    <div className="h-screen bg-slate-900 flex flex-col text-white font-sans relative">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft /></button>
            <div>
               <h1 className="font-bold text-lg">{item.title}</h1>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="uppercase tracking-wider">Version 1.0</span>
                  <span>•</span>
                  <span className="text-tv-teal font-bold">{item.status.replace(/_/g, ' ')}</span>
               </div>
            </div>
         </div>
         <div className="flex gap-3">
            <button onClick={() => setShowShareModal(true)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold flex gap-2 items-center text-sm transition-colors">
               <Share2 size={16} /> Share
            </button>
            <button className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold flex gap-2 items-center text-sm transition-colors">
               <XCircle size={16} /> Revisions
            </button>
            <button onClick={handleApprove} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 font-bold flex gap-2 items-center text-sm shadow-lg shadow-green-900/20 transition-all hover:scale-105">
               <CheckCircle size={16} /> Approve
            </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* Left: Video & Source */}
         <div className="w-[45%] bg-black flex flex-col border-r border-slate-800">
            {/* Player */}
            <div className="h-[50%] bg-black flex items-center justify-center relative group border-b border-slate-800">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                   <div className="text-xs text-slate-400 font-mono bg-black/50 px-2 py-1 rounded">{item.id}</div>
               </div>
               <div className="text-center opacity-80 group-hover:opacity-100 transition-opacity">
                 <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
                    <Play size={32} className="ml-1 text-white" />
                 </div>
                 <p className="text-slate-400 font-medium text-sm">Play Recording</p>
               </div>
            </div>
            
            {/* Transcript Area */}
            <div className="flex-1 bg-slate-900 flex flex-col min-h-0">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2"><AlignLeft size={14} /> Transcript & Files</h3>
                    <a href="#" className="text-xs text-tv-teal hover:underline flex items-center gap-1"><FolderOpen size={12} /> Project Files</a>
                </div>
                <div className="p-6 overflow-y-auto text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {item.originalTranscript || "No transcript available."}
                </div>
            </div>
         </div>

         {/* Right: Assets & Editing */}
         <div className="flex-1 bg-slate-900 flex flex-col min-h-0 relative">
             <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
                  <button onClick={() => setActiveCopyTab('HOOKS')} className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors ${activeCopyTab === 'HOOKS' ? 'text-tv-teal border-b-2 border-tv-teal bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                     Hooks
                  </button>
                  <button onClick={() => setActiveCopyTab('LINKEDIN')} className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors ${activeCopyTab === 'LINKEDIN' ? 'text-tv-teal border-b-2 border-tv-teal bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Linkedin size={14} /> LinkedIn
                  </button>
                  <button onClick={() => setActiveCopyTab('TWITTER')} className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors ${activeCopyTab === 'TWITTER' ? 'text-tv-teal border-b-2 border-tv-teal bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                     <Twitter size={14} /> X Thread
                  </button>
                  <button onClick={() => setActiveCopyTab('BLOG')} className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors ${activeCopyTab === 'BLOG' ? 'text-tv-teal border-b-2 border-tv-teal bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                     <FileText size={14} /> Blog
                  </button>
                  <button onClick={() => setActiveCopyTab('SCRIPT')} className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors ${activeCopyTab === 'SCRIPT' ? 'text-tv-teal border-b-2 border-tv-teal bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                     Teleprompter
                  </button>
                  <div className="ml-auto flex items-center px-4 text-xs text-slate-500 gap-1">
                     <Edit3 size={12} /> Editable
                  </div>
             </div>

             <div className="flex-1 relative">
                  {activeCopyTab === 'HOOKS' && (
                      <div className="p-6 space-y-4">
                          <p className="text-xs text-slate-500 mb-2">Viral hooks extracted from video content.</p>
                          {hooksCopy.map((hook, i) => (
                              <div key={i} className="flex gap-2">
                                  <input 
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-300 focus:border-tv-teal focus:outline-none"
                                    value={hook}
                                    onChange={(e) => {
                                        const newHooks = [...hooksCopy];
                                        newHooks[i] = e.target.value;
                                        setHooksCopy(newHooks);
                                    }}
                                  />
                              </div>
                          ))}
                      </div>
                  )}
                  {activeCopyTab === 'LINKEDIN' && (
                    <textarea 
                      value={linkedInCopy} 
                      onChange={e => setLinkedInCopy(e.target.value)}
                      className="w-full h-full bg-slate-900 p-6 text-slate-300 leading-relaxed text-sm resize-none focus:outline-none focus:bg-slate-800/50 transition-colors"
                      placeholder="LinkedIn post content..."
                    />
                  )}
                  {activeCopyTab === 'TWITTER' && (
                    <textarea 
                      value={twitterCopy} 
                      onChange={e => setTwitterCopy(e.target.value)}
                      className="w-full h-full bg-slate-900 p-6 text-slate-300 leading-relaxed text-sm resize-none focus:outline-none focus:bg-slate-800/50 transition-colors"
                      placeholder="Twitter thread content..."
                    />
                  )}
                  {activeCopyTab === 'BLOG' && (
                    <textarea 
                      value={blogCopy} 
                      onChange={e => setBlogCopy(e.target.value)}
                      className="w-full h-full bg-slate-900 p-6 text-slate-300 leading-relaxed text-sm resize-none focus:outline-none focus:bg-slate-800/50 transition-colors"
                      placeholder="Blog outline content..."
                    />
                  )}
                  {activeCopyTab === 'SCRIPT' && (
                    <textarea 
                      value={scriptCopy} 
                      onChange={e => setScriptCopy(e.target.value)}
                      className="w-full h-full bg-slate-900 p-6 text-slate-300 leading-relaxed text-sm resize-none focus:outline-none focus:bg-slate-800/50 transition-colors font-mono"
                      placeholder="Original teleprompter script..."
                    />
                  )}
             </div>
         </div>
      </div>

      {/* Share Dialog */}
      {showShareModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                  <h3 className="text-lg font-bold mb-4">Share Review Link</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Send via Email / SMS</label>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="client@example.com or phone"
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                                value={shareEmail}
                                onChange={e => setShareEmail(e.target.value)}
                              />
                              <button onClick={handleShare} className="bg-tv-teal text-white p-2 rounded-lg"><Send size={16} /></button>
                          </div>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                          <label className="block text-xs font-bold text-slate-400 mb-1">Direct Link</label>
                          <div className="flex gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                              <code className="text-xs text-slate-300 truncate flex-1">https://thoughtvoice.app/review/{item.id}</code>
                              <button className="text-tv-teal hover:text-white"><Copy size={14} /></button>
                          </div>
                      </div>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="mt-6 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold">Close</button>
              </div>
          </div>
      )}
    </div>
  );
};