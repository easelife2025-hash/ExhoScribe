'use client';

import { useState, useEffect } from 'react';
import { Workspace, Folder, Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Folder as FolderIcon, Plus, Settings, ChevronRight, Share2, MoreVertical, FileText } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { saveWorkspace, fetchWorkspaces, saveFolder, fetchFolders, saveNotification } from '../lib/db';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'owner'>('editor');

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail.trim() || !user) return;
    const targetEmail = inviteEmail.trim();
    const newMembers = [...activeWorkspace.members, { userId: targetEmail, role: inviteRole, email: targetEmail }];
    const updated = { ...activeWorkspace, members: newMembers };
    await saveWorkspace(updated);
    setActiveWorkspace(updated);
    setInviteEmail('');

    const title = `You've been invited`;
    const message = `${user.displayName || user.email} invited you to workspace "${activeWorkspace.name}" as ${inviteRole}`;
    
    // Save to DB (mock logic since we don't know the exact user ID, using email)
    const notification = {
      id: Date.now().toString(),
      userId: targetEmail,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    try {
      await saveNotification(notification);
      // Simulate saving for target user
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetEmail,
          title,
          body: message
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspace) return;
    const newMembers = activeWorkspace.members.filter(m => m.userId !== userId);
    const updated = { ...activeWorkspace, members: newMembers };
    await saveWorkspace(updated);
    setActiveWorkspace(updated);
  };

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
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between z-10">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Workspaces</h1>
        <button onClick={onClose} className="text-sm font-semibold text-brand-600 active:opacity-70 transition-opacity">Done</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Workspaces List */}
        <div className="w-1/3 max-w-[280px] bg-slate-100 border-r border-slate-200 flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Teams</h2>
            <button onClick={() => setIsCreatingWorkspace(true)} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500 active:scale-95">
              <Plus className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {isCreatingWorkspace && (
              <div className="p-2 bg-white rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] mb-2">
                <input 
                  autoFocus
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                  placeholder="Workspace name..."
                  className="w-full text-sm outline-none mb-2 px-2 py-1 bg-slate-50 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsCreatingWorkspace(false)} className="text-xs text-slate-500 font-medium px-2 py-1">Cancel</button>
                  <button onClick={handleCreateWorkspace} className="text-xs text-brand-600 font-semibold px-2 py-1">Create</button>
                </div>
              </div>
            )}
            {workspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws); setActiveFolder(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between active:scale-95 ${activeWorkspace?.id === ws.id ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-brand-900' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${activeWorkspace?.id === ws.id ? 'bg-brand-600 shadow-md shadow-brand-500/20' : 'bg-slate-400'}`}>
                    {ws.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
              </button>
            ))}
            {workspaces.length === 0 && !isCreatingWorkspace && (
              <div className="text-center p-4 text-sm text-slate-500 font-medium">No workspaces yet.</div>
            )}
          </div>
        </div>

        {/* Main Content: Folders & Notes */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {activeWorkspace ? (
            <>
              {/* Workspace Header */}
              <div className="p-6 bg-slate-50 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{activeWorkspace.name}</h2>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-2">
                      <Users className="w-4 h-4" /> {activeWorkspace.members.length} {activeWorkspace.members.length === 1 ? 'Member' : 'Members'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowShareModal(true)} className="p-2.5 text-slate-500 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:text-brand-600 rounded-xl transition-all active:scale-95"><Share2 className="w-5 h-5" strokeWidth={2} /></button>
                    <button className="p-2.5 text-slate-500 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:text-slate-900 rounded-xl transition-all active:scale-95"><Settings className="w-5 h-5" strokeWidth={2} /></button>
                  </div>
                </div>
              </div>

              {showShareModal && (
                <div className="absolute inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-[0_20px_60px_rgb(0,0,0,0.1)]">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Workspace</h3>
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="email" 
                        placeholder="Invite by email..." 
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="flex-1 bg-slate-50 shadow-inner rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                      />
                      <select 
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as any)}
                        className="bg-slate-50 rounded-xl px-3 py-3 text-sm focus:outline-none font-medium text-slate-700"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button onClick={handleInvite} className="bg-brand-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all">Invite</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                      {activeWorkspace.members.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand-600">
                              {(m.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{m.email || 'Unknown User'}</div>
                              <div className="text-xs font-medium text-slate-500 capitalize">{m.role}</div>
                            </div>
                          </div>
                          {m.userId !== user?.uid && (
                            <button onClick={() => handleRemoveMember(m.userId)} className="text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Remove</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setShowShareModal(false)} className="w-full mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold active:scale-95 transition-all">Done</button>
                  </div>
                </div>
              )}

              {/* Folders and Notes */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 pb-safe-bottom">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <FolderIcon className="w-4 h-4" /> Folders
                    </h3>
                    <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-semibold text-brand-600 flex items-center gap-1 active:scale-95 transition-all"><Plus className="w-3 h-3" strokeWidth={2}/> New</button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => setActiveFolder(null)}
                      className={`p-4 rounded-[20px] text-left transition-all active:scale-95 ${!activeFolder ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-brand-600 ring-2 ring-brand-500/20' : 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-slate-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}
                    >
                      <FileText className={`w-6 h-6 mb-3 ${!activeFolder ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={2} />
                      <div className="font-semibold text-sm text-slate-900">All Notes</div>
                    </button>
                    {folders.map(folder => (
                      <button 
                        key={folder.id}
                        onClick={() => setActiveFolder(folder)}
                        className={`p-4 rounded-[20px] text-left transition-all active:scale-95 ${activeFolder?.id === folder.id ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-brand-600 ring-2 ring-brand-500/20' : 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-slate-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}
                      >
                        <FolderIcon className={`w-6 h-6 mb-3 ${activeFolder?.id === folder.id ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={2} />
                        <div className="font-semibold text-sm truncate text-slate-900">{folder.name}</div>
                      </button>
                    ))}
                    {isCreatingFolder && (
                      <div className="p-4 rounded-[20px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-2 ring-brand-500 flex flex-col gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                          placeholder="Folder name..."
                          className="text-sm outline-none w-full font-medium bg-transparent"
                        />
                        <div className="flex justify-end gap-2 mt-auto">
                          <button onClick={() => setIsCreatingFolder(false)} className="text-[10px] font-medium text-slate-500 px-2 py-1">Cancel</button>
                          <button onClick={handleCreateFolder} className="text-[10px] font-semibold text-brand-600 px-2 py-1">Create</button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    {activeFolder ? activeFolder.name : 'Notes in Workspace'}
                  </h3>
                  <div className="flex flex-col gap-4">
                    {folderNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => onOpenNote(note)}
                        className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left active:scale-[0.98] transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 mb-1.5 text-base">{note.title}</div>
                          <div className="text-xs font-medium text-slate-500">{note.date} • {note.duration}</div>
                        </div>
                        <div className="p-2 group-hover:translate-x-1 transition-transform">
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                    {folderNotes.length === 0 && (
                      <div className="text-center p-10 bg-slate-100 rounded-[24px]">
                        <p className="text-sm font-medium text-slate-500">No notes here yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-20 h-20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-slate-400" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Workspace Selected</h2>
              <p className="text-sm font-medium text-slate-500 max-w-xs">Select a workspace from the sidebar or create a new one to collaborate with your team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
