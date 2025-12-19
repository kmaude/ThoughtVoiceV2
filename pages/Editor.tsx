import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storageService } from '../services/database';
import { ContentItem } from '../types';
import { ArrowLeft, Copy, Send, Share2, Edit3, Check, FileText } from 'lucide-react';

export const Editor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'linkedin' | 'twitter' | 'blog' | 'script'>('linkedin');
  const [editedContent, setEditedContent] = useState('');
  const [editorNotes, setEditorNotes] = useState('');

  useEffect(() => {
    const loadItem = async () => {
      const allItems = await db.getContent();
      const found = allItems.find(i => i.id === id);
      if (found) {
        setItem(found);
        setEditorNotes(found.editorNotes || '');
        // Set initial content based on default tab
        setEditedContent(found.assets?.linkedInPost || '');
      } else {
        navigate('/library');
      }
    };
    loadItem();
  }, [id, navigate]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (!item?.assets) return;
    
    let content = '';
    switch(tab) {
      case 'linkedin': content = item.assets.linkedInPost; break;
      case 'twitter': content = item.assets.twitterThread.join('\n\n---\n\n'); break;
      case 'blog': content = item.assets.blogOutline; break;
      case 'script': content = item.assets.cleanScript; break;
    }
    setEditedContent(content);
  };

  const handleNotesBlur = () => {
    if (item && id) {
      db.updateContentItem(id, { editorNotes });
    }
  };

  if (!item || !item.assets) return null;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/library')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">{item.title}</h1>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Draft</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-lg flex items-center gap-2">
             <Share2 size={16} /> Share Review Link
          </button>
          <button className="px-4 py-2 bg-tv-teal text-white font-medium text-sm rounded-lg hover:bg-teal-600 flex items-center gap-2 shadow-lg shadow-teal-500/20">
             <Send size={16} /> Publish
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Source & Context */}
        <aside className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* Editor Notes Section */}
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-2 text-yellow-800 font-bold text-sm mb-2">
              <Edit3 size={16} /> Editor Notes
            </div>
            <textarea
              value={editorNotes}
              onChange={(e) => setEditorNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Internal feedback, revision requests, or strategy notes..."
              className="w-full bg-white p-3 rounded-lg border border-yellow-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[100px]"
            />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Deliverables</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {item.requiredDeliverables?.map(d => (
                <span key={d} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded">{d}</span>
              ))}
              {(!item.requiredDeliverables || item.requiredDeliverables.length === 0) && (
                <span className="text-xs text-slate-400 italic">No specific formats requested</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Source Transcript</h3>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {item.originalTranscript}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Viral Hooks</h3>
            <div className="space-y-3">
              {item.assets.hooks.map((hook, i) => (
                <div key={i} className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-indigo-900 text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                  {hook}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Editor */}
        <main className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-white">
             {[
               { id: 'linkedin', label: 'LinkedIn Post' },
               { id: 'twitter', label: 'X Thread' },
               { id: 'blog', label: 'Blog Outline' },
               { id: 'script', label: 'Clean Script' }
             ].map(tab => (
               <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-tv-teal text-tv-teal' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>

          {/* Text Area */}
          <div className="flex-1 p-8 bg-slate-50/50">
             <div className="max-w-3xl mx-auto bg-white h-full rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-2 border-b border-slate-100 flex justify-end gap-2">
                  <button className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600" title="Copy to Clipboard">
                    <Copy size={16} />
                  </button>
                </div>
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="flex-1 w-full p-8 resize-none focus:outline-none text-slate-800 leading-relaxed text-lg font-sans"
                />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};