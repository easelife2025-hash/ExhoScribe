'use client';

import { useState, useMemo, useEffect } from 'react';
import { Note } from '../types';
import { Search, X, Calendar, Clock, ChevronRight, Mic, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchViewProps {
  notes: Note[];
  onClose: () => void;
  onOpenNote: (note: Note) => void;
}

export default function SearchView({ notes, onClose, onOpenNote }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (mounted) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecentSearches(parsed);
        }
      } catch (e) {}
    }
    return () => { mounted = false; };
  }, []);

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleNoteClick = (note: Note) => {
    saveRecentSearch(query);
    onOpenNote(note);
  };

  const filters = ['All', 'Meetings', 'Transcripts', 'Action Items', 'People'];

  const results = useMemo((): Array<{ note: Note; score: number; matchedContext: string }> => {
    if (!query.trim() && activeFilter === 'All') return [];
    
    let filtered = notes;
    
    // Apply filters conceptually
    if (activeFilter === 'Action Items') {
      filtered = filtered.filter(n => n.actionItems && n.actionItems.length > 0);
    } else if (activeFilter === 'Transcripts') {
      filtered = filtered.filter(n => n.transcript && n.transcript.length > 0);
    }
    
    if (!query.trim()) {
      return filtered.map(note => ({ note, score: 0, matchedContext: '' }));
    }

    const lowerQuery = query.toLowerCase();

    return filtered.map(note => {
      let score = 0;
      let matchedContext = '';

      if (note.title.toLowerCase().includes(lowerQuery)) score += 10;
      if (note.summary?.toLowerCase().includes(lowerQuery)) {
        score += 5;
        if (!matchedContext) matchedContext = note.summary;
      }
      
      if (note.actionItems?.some(a => a.toLowerCase().includes(lowerQuery))) {
        score += 5;
        if (!matchedContext) matchedContext = note.actionItems.find(a => a.toLowerCase().includes(lowerQuery)) || '';
      }
      
      if (note.tags?.some(t => t.toLowerCase().includes(lowerQuery))) score += 3;
      
      if (note.transcript) {
        const matchingTranscript = note.transcript.find(t => 
          t.text.toLowerCase().includes(lowerQuery) || t.speaker.toLowerCase().includes(lowerQuery)
        );
        if (matchingTranscript) {
          score += 4;
          if (!matchedContext) matchedContext = `${matchingTranscript.speaker}: ${matchingTranscript.text}`;
        }
      }

      if (note.date.toLowerCase().includes(lowerQuery)) score += 2;

      return { note, score, matchedContext };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
    
  }, [query, activeFilter, notes]);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim() || !text) return text;
    const regex = new RegExp(`(${q})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-brand-200 text-brand-900 rounded-sm px-0.5">{part}</span> : part
        )}
      </>
    );
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full absolute inset-0 z-50">
      {/* Header */}
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-white border-b border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              autoFocus
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search meetings, topics, people..." 
              className="w-full bg-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-sm font-medium text-slate-600 px-2 py-2">
            Cancel
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-brand-900 text-white shadow-md shadow-brand-900/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {!query && activeFilter === 'All' ? (
          <div>
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Searches</h3>
                <div className="flex flex-col gap-2">
                  {recentSearches.map((search, i) => (
                    <button 
                      key={i}
                      onClick={() => setQuery(search)}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 text-left hover:border-brand-200 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-center mt-12">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-600 font-medium mb-1">Search your memory</h3>
              <p className="text-sm text-slate-400 max-w-[240px] mx-auto">
                Find anything from past meetings, transcripts, decisions, and action items.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {results.length} {results.length === 1 ? 'Result' : 'Results'}
            </h3>
            
            {results.map((result, idx) => (
              <motion.button
                key={result.note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleNoteClick(result.note)}
                className="bg-white p-4 rounded-[20px] shadow-sm shadow-slate-200/50 border border-slate-100 text-left w-full hover:shadow-md hover:border-brand-200 transition-all group flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-display font-medium text-slate-900 leading-tight pr-4">
                    {highlightMatch(result.note.title, query)}
                  </h4>
                  <div className="bg-slate-50 rounded-full p-1.5 group-hover:bg-brand-50 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                  </div>
                </div>
                
                {result.matchedContext && (
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic">
                    &quot;...{highlightMatch(result.matchedContext, query)}...&quot;
                  </p>
                )}

                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{highlightMatch(result.note.date, query)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
            
            {results.length === 0 && (
              <div className="text-center mt-12">
                <p className="text-slate-500 font-medium">No results found for &quot;{query}&quot;</p>
                <p className="text-sm text-slate-400 mt-1">Try a different keyword or filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
