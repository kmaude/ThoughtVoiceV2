
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/database';
import { geminiService } from '../services/geminiService';
import { UserProfile, DailyPrompt, Topic, ContentItem, ContentStatus, PlanTier } from '../types';
import { Mic, Video, Upload, RefreshCw, Lightbulb, Plus, Clock, CheckCircle, Smartphone, ThumbsUp, ThumbsDown, Settings, Globe, Calendar } from 'lucide-react';
import { OwlLogo } from '../components/OwlLogo';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<'UP' | 'DOWN' | null>(null);
  const [greeting, setGreeting] = useState('Good Morning');
  const [nextDeliveryDate, setNextDeliveryDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const user = await db.getUser();
      if (!user) return; 
      setProfile(user);

      // Determine Greeting based on User's Timezone
      const now = new Date();
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone }));
      const hour = localTime.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      // Calculate Next Delivery
      const schedule = db.getDeliverySchedule(user.schedule);
      if (schedule.length > 0) {
          setNextDeliveryDate(schedule[0]);
      }

      const [newTopics, content, activePrompt] = await Promise.all([
        geminiService.generateWeeklyTopics(user),
        db.getContent(),
        db.getActivePromptForUser(user.id)
      ]);

      setTopics(newTopics);
      setRecentContent(content);
      setPrompt(activePrompt);
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleFeedback = (type: 'UP' | 'DOWN') => {
    if (feedbackGiven) return;
    setFeedbackGiven(type);
    console.log(`[FEEDBACK] User rated prompt ${prompt?.id}: ${type}`);
  };

  if (!profile) return null;

  const handleItemClick = (item: ContentItem) => {
    if (item.status === ContentStatus.READY_FOR_REVIEW) {
      navigate(`/review/${item.id}`);
    } else {
      navigate(`/editor/${item.id}`);
    }
  };

  const getStatusBadge = (item: ContentItem) => {
    const status = item.status;
    switch(status) {
      case 'SUBMITTED_TO_EDITORS': 
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> In Queue</span>;
      case 'EDITING_IN_PROGRESS':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><RefreshCw size={12} /> Editing</span>;
      case 'READY_FOR_REVIEW':
        return (
          <span 
            onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
            className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-green-200 transition-colors"
          >
            <CheckCircle size={12} /> Review
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  const simulateMorningNotification = () => {
    if (prompt) {
      navigate(`/capture?promptId=${prompt.id}&mode=video`);
    } else {
      alert("No prompt scheduled for today. Check 'Staff Portal' to schedule one!");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{greeting}, {profile.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Your executive briefing and production pipeline.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
             onClick={simulateMorningNotification}
             className="flex-1 md:flex-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
          >
             <Smartphone size={16} className="text-tv-coral" /> Simulate Alert
          </button>
          <button 
            onClick={() => navigate('/capture')}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20 text-sm"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* Upcoming Strategy Widget */}
      {nextDeliveryDate && !prompt && (
          <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-4 animate-fade-in shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Calendar size={20} />
              </div>
              <div>
                  <h4 className="font-bold text-slate-900 text-sm">Next Prompt Incoming</h4>
                  <p className="text-xs text-slate-500">Expected delivery on <span className="font-bold text-indigo-600">{nextDeliveryDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}</span> based on your schedule.</p>
              </div>
          </div>
      )}

      {/* Latest Status */}
      {recentContent.length > 0 && recentContent[0].status !== 'PUBLISHED' && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="p-2 bg-indigo-100 rounded-full text-indigo-600 shrink-0"><Clock size={20} /></div>
             <div className="min-w-0">
               <h4 className="font-bold text-indigo-900 text-sm truncate">Latest: "{recentContent[0].title}"</h4>
               <p className="text-xs text-indigo-700">{recentContent[0].status.replace(/_/g, ' ')}</p>
             </div>
          </div>
          <button 
            onClick={() => handleItemClick(recentContent[0])}
            className="text-xs font-bold text-indigo-600 hover:underline shrink-0 ml-2"
          >
            {recentContent[0].status === ContentStatus.READY_FOR_REVIEW ? 'Review Now' : 'Details'}
          </button>
        </div>
      )}

      {/* Flash Prompt */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tv-teal opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
             <OwlLogo size={80} className="animate-pulse opacity-50" />
             <p className="text-slate-400">Syncing with HQ...</p>
          </div>
        ) : !prompt ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-tv-teal" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">You're all caught up!</h3>
              <p className="text-slate-400 max-w-md mx-auto">No prompts scheduled for today. Check back tomorrow or visit the Staff Portal to schedule a new topic.</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start animate-fade-in">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-tv-yellow uppercase">
                  <Lightbulb size={12} /> Today's Flash Prompt
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleFeedback('UP')} className={`p-2 rounded-full transition-colors ${feedbackGiven === 'UP' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:bg-white/5'}`}><ThumbsUp size={16} /></button>
                  <button onClick={() => handleFeedback('DOWN')} className={`p-2 rounded-full transition-colors ${feedbackGiven === 'DOWN' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-white/5'}`}><ThumbsDown size={16} /></button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">"{prompt.question}"</h2>
                <div className="space-y-2">
                   {prompt.contextPoints?.map((point, i) => (
                      <div key={i} className="flex gap-3 text-slate-300">
                         <span className="text-tv-teal mt-1.5">•</span>
                         <p className="text-base font-light leading-relaxed">{point}</p>
                      </div>
                   )) || <p className="text-slate-300 text-base font-light leading-relaxed">{prompt.context}</p>}
                </div>

                {prompt.sources && prompt.sources.length > 0 && (
                   <div className="pt-4 border-t border-white/10">
                      <div className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                         <Globe size={12} /> Verified Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prompt.sources.map((source, i) => (
                           <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-slate-300 hover:text-white transition-colors truncate max-w-[150px]">
                              {source.title}
                           </a>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
              <button onClick={() => navigate(`/capture?promptId=${prompt.id}&mode=video`)} className="bg-white text-slate-900 hover:bg-slate-50 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-transform active:scale-95">
                <Video className="text-tv-teal" /> Record Video
              </button>
              <button onClick={() => navigate(`/capture?promptId=${prompt.id}&mode=audio`)} className="bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors">
                <Mic className="text-tv-coral" /> Record Audio
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
             <h3 className="text-xl font-bold text-slate-900">Weekly Research</h3>
             {topics.length > 0 && topics[0].sources && (
                <div className="text-xs text-slate-400">
                   Sources Verified by Google Search
                </div>
             )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.slice(0, 4).map((topic, idx) => (
                <div key={topic.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-tv-teal cursor-pointer group shadow-sm transition-all flex flex-col justify-between" onClick={() => navigate('/capture?topicId=' + topic.id)}>
                  <div>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-3 inline-block ${topic.category === 'Strategic' ? 'bg-purple-100 text-purple-600' : topic.category === 'Trending' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>{topic.category}</span>
                    <h4 className="font-bold text-slate-800 mb-2 group-hover:text-tv-teal">{topic.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{topic.description}</p>
                  </div>
                  {topic.sources && topic.sources.length > 0 && (
                     <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 flex items-center gap-1">
                        <Globe size={10} /> {topic.sources[0].title}
                     </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Pipeline</h3>
              <div className="space-y-4">
                {recentContent.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors" onClick={() => handleItemClick(item)}>
                    <div className="truncate w-32 font-medium text-slate-700">{item.title}</div>
                    {getStatusBadge(item)}
                  </div>
                ))}
                {recentContent.length === 0 && <div className="text-slate-400 text-sm italic">No active jobs.</div>}
              </div>
           </div>
           
           {/* Concierge Upload - Only for Enterprise Plans */}
           {profile.plan === PlanTier.ENTERPRISE && (
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center h-48 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-slate-400"><Upload size={20} /></div>
                <h4 className="font-bold text-slate-700">Concierge Upload</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[160px]">Drag & drop existing files.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
