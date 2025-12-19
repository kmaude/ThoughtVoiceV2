import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storage';
import { ContentItem } from '../types';
import { FileText, Mic, Video, Clock, ChevronRight } from 'lucide-react';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    setItems(storageService.getContent());
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'VIDEO': return <Video size={20} className="text-tv-teal" />;
      case 'AUDIO': return <Mic size={20} className="text-tv-coral" />;
      default: return <FileText size={20} className="text-slate-500" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Content Library</h1>
        <div className="flex gap-2">
           <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2">
             <option>All Types</option>
             <option>Video</option>
             <option>Audio</option>
           </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <FileText className="text-slate-300" size={32} />
           </div>
           <h3 className="text-lg font-bold text-slate-900">No content yet</h3>
           <p className="text-slate-500 mt-1 mb-6">Start your first thought leadership piece.</p>
           <button 
             onClick={() => navigate('/capture')}
             className="bg-tv-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-600"
            >
             Create New
           </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/editor/${item.id}`)}
              className="bg-white p-5 rounded-xl border border-slate-100 hover:border-tv-teal shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-6"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                {getIcon(item.type)}
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{item.status}</span>
                </div>
              </div>

              <div className="flex gap-2">
                 <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">LinkedIn</div>
                 <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Twitter</div>
              </div>
              
              <ChevronRight className="text-slate-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};