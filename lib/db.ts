import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { Note, Workspace, Folder, Comment, Notification } from '@/types';

// Simple retry helper
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, backoff));
    return withRetry(fn, retries - 1, backoff * 2);
  }
};

export async function saveNote(userId: string, note: Note) {
  const noteRef = doc(db, 'users', userId, 'notes', note.id);
  await withRetry(() => setDoc(noteRef, note));
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef); 
    const snapshot = await withRetry(() => getDocs(q));
    const notes: Note[] = [];
    snapshot.forEach((doc) => {
      notes.push(doc.data() as Note);
    });
    return notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err: any) {
    console.error("Error fetching notes:", err);
    throw new Error(`Failed to fetch notes: ${err.message}`);
  }
}

export async function deleteNote(userId: string, noteId: string) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await withRetry(() => deleteDoc(noteRef));
}

export async function saveWorkspace(workspace: Workspace) {
  const wsRef = doc(db, 'workspaces', workspace.id);
  await withRetry(() => setDoc(wsRef, workspace));
}

export async function updateNote(userId: string, noteId: string, updates: Partial<Note>) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await withRetry(() => setDoc(noteRef, updates, { merge: true }));
}

export function subscribeToNote(userId: string, noteId: string, callback: (note: Note | null) => void, onError?: (error: Error) => void) {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  return onSnapshot(noteRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Note);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to note:", error);
    if (onError) onError(error);
  });
}

export function subscribeToNotes(userId: string, callback: (notes: Note[]) => void, onError?: (error: Error) => void) {
  const notesRef = collection(db, 'users', userId, 'notes');
  return onSnapshot(notesRef, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((doc) => notes.push(doc.data() as Note));
    callback(notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, (error) => {
    console.error("Error subscribing to notes:", error);
    if (onError) onError(error);
  });
}

export async function updateWorkspace(workspaceId: string, updates: Partial<Workspace>) {
  const wsRef = doc(db, 'workspaces', workspaceId);
  await withRetry(() => setDoc(wsRef, updates, { merge: true }));
}

export async function fetchWorkspaces(userId: string): Promise<Workspace[]> {
  const wsRef = collection(db, 'workspaces');
  const snapshot = await withRetry(() => getDocs(wsRef));
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
  await withRetry(() => setDoc(folderRef, folder));
}

export async function fetchFolders(workspaceId: string): Promise<Folder[]> {
  const folderRef = collection(db, 'folders');
  const q = query(folderRef, where('workspaceId', '==', workspaceId));
  const snapshot = await withRetry(() => getDocs(q));
  const folders: Folder[] = [];
  snapshot.forEach((doc) => {
    folders.push(doc.data() as Folder);
  });
  return folders;
}

export async function saveComment(comment: Comment) {
  const commentRef = doc(db, 'comments', comment.id);
  await withRetry(() => setDoc(commentRef, comment));
}

export function subscribeToComments(noteId: string, callback: (comments: Comment[]) => void, onError?: (error: Error) => void) {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('noteId', '==', noteId));
  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => comments.push(doc.data() as Comment));
    callback(comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, (error) => {
    console.error("Error subscribing to comments:", error);
    if (onError) onError(error);
  });
}

export async function saveFCMToken(userId: string, token: string) {
  const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
  await withRetry(() => setDoc(tokenRef, { token, updatedAt: new Date().toISOString() }));
}

export async function saveNotification(notification: Notification) {
  const notifRef = doc(db, 'users', notification.userId, 'notifications', notification.id);
  await withRetry(() => setDoc(notifRef, notification));
}

export function subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void, onError?: (error: Error) => void) {
  const notifRef = collection(db, 'users', userId, 'notifications');
  return onSnapshot(notifRef, (snapshot) => {
    const notifs: Notification[] = [];
    snapshot.forEach((doc) => notifs.push(doc.data() as Notification));
    callback(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (error) => {
    console.error("Error subscribing to notifications:", error);
    if (onError) onError(error);
  });
}
