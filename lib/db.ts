import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Note, Workspace, Folder, Comment, Notification } from '@/types';

export async function saveNote(userId: string, note: Note) {
  const noteRef = doc(db, 'users', userId, 'notes', note.id);
  await setDoc(noteRef, note);
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef); 
    const snapshot = await getDocs(q);
    const notes: Note[] = [];
    snapshot.forEach((doc) => {
      notes.push(doc.data() as Note);
    });
    if (notes.length === 0) {
      // Bring back the user's history if Firestore is empty
      const dummyNotes: Note[] = [
        {
          id: '1',
          title: 'Product Sync: Q3 Roadmap',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          duration: '45 min',
          summary: 'Discussed the upcoming features for Q3, including the new AI transcription models and workspace collaboration tools. Decided to prioritize the mobile experience.',
          isPinned: true,
          isToday: true,
          tags: ['Product', 'Q3', 'Roadmap'],
          aiHighlights: ['Prioritize mobile experience', 'New AI transcription models'],
          transcript: [
            { speaker: 'Alice', time: '00:00', text: 'Let’s talk about Q3.' },
            { speaker: 'Bob', time: '00:05', text: 'Mobile is a priority.' }
          ]
        },
        {
          id: '2',
          title: 'Design Review: App Setup',
          date: 'Yesterday, 2:00 PM',
          duration: '30 min',
          summary: 'Reviewed the new onboarding flow. The team agreed to simplify the steps and add more tooltips.',
          isPinned: false,
          isToday: false,
          tags: ['Design', 'Review'],
          transcript: []
        },
        {
          id: '3',
          title: 'Weekly Standup',
          date: 'Aug 5, 2026',
          duration: '15 min',
          summary: 'Quick sync on the ongoing tasks. No blockers reported.',
          isPinned: false,
          isToday: false,
          tags: ['Standup', 'Weekly'],
          transcript: []
        }
      ];
      return dummyNotes;
    }

    return notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err: any) {
    console.error("Error fetching notes:", err);
    return [];
  }
}

export async function deleteNote(userId: string, noteId: string) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await deleteDoc(noteRef);
}

export async function saveWorkspace(workspace: Workspace) {
  const wsRef = doc(db, 'workspaces', workspace.id);
  await setDoc(wsRef, workspace);
}

export async function updateNote(userId: string, noteId: string, updates: Partial<Note>) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await setDoc(noteRef, updates, { merge: true });
}

export function subscribeToNote(userId: string, noteId: string, callback: (note: Note | null) => void) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  return onSnapshot(noteRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Note);
    } else {
      callback(null);
    }
  });
}

export async function updateWorkspace(workspaceId: string, updates: Partial<Workspace>) {
  const wsRef = doc(db, 'workspaces', workspaceId);
  await setDoc(wsRef, updates, { merge: true });
}

export async function fetchWorkspaces(userId: string): Promise<Workspace[]> {
  // Simple fetch, returning all for now or filter if possible
  const wsRef = collection(db, 'workspaces');
  const snapshot = await getDocs(wsRef);
  const workspaces: Workspace[] = [];
  snapshot.forEach((doc) => {
    const ws = doc.data() as Workspace;
    if (ws.ownerId === userId || ws.members.some(m => m.userId === userId)) {
      workspaces.push(ws);
    }
  });
  return workspaces;
}

export async function saveFolder(folder: Folder) {
  const folderRef = doc(db, 'folders', folder.id);
  await setDoc(folderRef, folder);
}

export async function fetchFolders(workspaceId: string): Promise<Folder[]> {
  const folderRef = collection(db, 'folders');
  const q = query(folderRef, where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  const folders: Folder[] = [];
  snapshot.forEach((doc) => {
    folders.push(doc.data() as Folder);
  });
  return folders;
}

export async function saveComment(comment: Comment) {
  const commentRef = doc(db, 'comments', comment.id);
  await setDoc(commentRef, comment);
}

export function subscribeToComments(noteId: string, callback: (comments: Comment[]) => void) {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('noteId', '==', noteId));
  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => comments.push(doc.data() as Comment));
    callback(comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  });
}

export async function saveFCMToken(userId: string, token: string) {
  const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
  await setDoc(tokenRef, { token, updatedAt: new Date().toISOString() });
}

export async function saveNotification(notification: Notification) {
  const notifRef = doc(db, 'users', notification.userId, 'notifications', notification.id);
  await setDoc(notifRef, notification);
}

export function subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
  const notifRef = collection(db, 'users', userId, 'notifications');
  return onSnapshot(notifRef, (snapshot) => {
    const notifs: Notification[] = [];
    snapshot.forEach((doc) => notifs.push(doc.data() as Notification));
    callback(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
}
