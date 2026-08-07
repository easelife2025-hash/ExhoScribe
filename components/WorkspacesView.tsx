'use client';

import { useState, useEffect } from 'react';
import { Workspace, Folder, Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Folder as FolderIcon, Plus, Settings, ChevronRight, Share2, MoreVertical, FileText } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { saveWorkspace, fetchWorkspaces, saveFolder, fetchFolders } from '../lib/db';

interface WorkspacesViewProps {
  onClose: () => void;
  notes: Note[];
  onOpenNote: (note: Note) => void;
}

export default function WorkspacesView({ onClose, notes, onOpenNote }: WorkspacesViewProps) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadWorkspaces = async () => {
    if (!user) return;
    const ws = await fetchWorkspaces(user.uid);
    setWorkspaces(ws);
    if (ws.length > 0) {
      setActiveWorkspace(prev => prev || ws[0]);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadWorkspaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFolders = async (workspaceId: string) => {
    const f = await fetchFolders(workspaceId);
    setFolders(f);
  };

  useEffect(() => {
    if (activeWorkspace) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFolders(activeWorkspace.id);
    }
  }, [activeWorkspace]);

  const handleCreateWorkspace = async () => {
    if (!user || !newWorkspaceName.trim()) return;
    const newWs: Workspace = {
      id: Date.now().toString(),
      name: newWorkspaceName,
      ownerId: user.uid,
      members: [{ userId: user.uid, role: 'owner', email: user.email || '' }],
      createdAt: new Date().toISOString()
    };
    await saveWorkspace(newWs);
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
    loadWorkspaces();
    setActiveWorkspace(newWs);
  };

  const handleCreateFolder = async () => {
    if (!activeWorkspace || !newFolderName.trim()) return;
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName,
      workspaceId: activeWorkspace.id,
      createdAt: new Date().toISOString()
    };
    await saveFolder(newFolder);
    setNewFolderName('');
    setIsCreatingFolder(false);
    loadFolders(activeWorkspace.id);
  };

  const workspaceNotes = notes.filter(n => n.workspaceId === activeWorkspace?.id);
  const folderNotes = activeFolder ? workspaceNotes.filter(n => n.folderId === activeFolder.id) : workspaceNotes.filter(n => !n.folderId);

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full absolute inset-0 z-40 overflow-hidden">
      {/* Header */}
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
        <h1 className="font-display text-xl font-semibold text-slate-900">Workspaces</h1>
        <button onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-slate-900">Done</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Workspaces List */}
        <div className="w-1/3 max-w-[280px] bg-slate-100 border-r border-slate-200 flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Teams</h2>
            <button onClick={() => setIsCreatingWorkspace(true)} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {isCreatingWorkspace && (
              <div className="p-2 bg-white rounded-lg border border-brand-200 shadow-sm mb-2">
                <input 
                  autoFocus
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                  placeholder="Workspace name..."
                  className="w-full text-sm outline-none mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsCreatingWorkspace(false)} className="text-xs text-slate-500">Cancel</button>
                  <button onClick={handleCreateWorkspace} className="text-xs text-brand-600 font-medium">Create</button>
                </div>
              </div>
            )}
            {workspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws); setActiveFolder(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeWorkspace?.id === ws.id ? 'bg-white shadow-sm text-brand-900' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs text-white ${activeWorkspace?.id === ws.id ? 'bg-brand-500' : 'bg-slate-400'}`}>
                    {ws.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
              </button>
            ))}
            {workspaces.length === 0 && !isCreatingWorkspace && (
              <div className="text-center p-4 text-sm text-slate-500">No workspaces yet.</div>
            )}
          </div>
        </div>

        {/* Main Content: Folders & Notes */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {activeWorkspace ? (
            <>
              {/* Workspace Header */}
              <div className="p-6 bg-white border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-slate-900">{activeWorkspace.name}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4" /> {activeWorkspace.members.length} {activeWorkspace.members.length === 1 ? 'Member' : 'Members'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><Share2 className="w-5 h-5" /></button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><Settings className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              {/* Folders and Notes */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FolderIcon className="w-4 h-4 text-slate-400" /> Folders
                    </h3>
                    <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-medium text-brand-600 flex items-center gap-1"><Plus className="w-3 h-3"/> New</button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => setActiveFolder(null)}
                      className={`p-4 rounded-[16px] text-left transition-all border ${!activeFolder ? 'bg-brand-50 border-brand-200 text-brand-900' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'}`}
                    >
                      <FileText className={`w-6 h-6 mb-2 ${!activeFolder ? 'text-brand-600' : 'text-slate-400'}`} />
                      <div className="font-medium text-sm">All Notes</div>
                    </button>
                    {folders.map(folder => (
                      <button 
                        key={folder.id}
                        onClick={() => setActiveFolder(folder)}
                        className={`p-4 rounded-[16px] text-left transition-all border ${activeFolder?.id === folder.id ? 'bg-brand-50 border-brand-200 text-brand-900' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'}`}
                      >
                        <FolderIcon className={`w-6 h-6 mb-2 ${activeFolder?.id === folder.id ? 'text-brand-600' : 'text-slate-400'}`} />
                        <div className="font-medium text-sm truncate">{folder.name}</div>
                      </button>
                    ))}
                    {isCreatingFolder && (
                      <div className="p-4 rounded-[16px] bg-white border border-brand-200 flex flex-col gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                          placeholder="Folder name..."
                          className="text-sm outline-none w-full"
                        />
                        <div className="flex justify-end gap-2 mt-auto">
                          <button onClick={() => setIsCreatingFolder(false)} className="text-[10px] text-slate-500">Cancel</button>
                          <button onClick={handleCreateFolder} className="text-[10px] text-brand-600 font-medium">Create</button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
                    {activeFolder ? activeFolder.name : 'Notes in Workspace'}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {folderNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => onOpenNote(note)}
                        className="bg-white p-4 rounded-[16px] shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-medium text-slate-900 mb-1">{note.title}</div>
                          <div className="text-xs text-slate-500">{note.date} • {note.duration}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                      </button>
                    ))}
                    {folderNotes.length === 0 && (
                      <div className="text-center p-8 bg-white border border-slate-100 border-dashed rounded-[16px]">
                        <p className="text-sm text-slate-500">No notes here yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <h2 className="text-lg font-medium text-slate-700 mb-2">No Workspace Selected</h2>
              <p className="text-sm max-w-xs">Select a workspace from the sidebar or create a new one to collaborate with your team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
