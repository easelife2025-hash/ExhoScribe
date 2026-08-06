export type Note = {
  id: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
  transcript: Array<{ speaker: string; time: string; text: string }>;
  tags: string[];
  isPinned?: boolean;
  isToday?: boolean;
  aiHighlights?: string[];
  chapters?: Array<{ title: string; time: string; summary: string }>;
  actionItems?: string[];
  decisions?: string[];
  tasks?: string[];
  keywords?: string[];
  sentiment?: string;
  workspaceId?: string;
  folderId?: string;
};

export type ViewState = 'home' | 'recording' | 'transcript' | 'profile' | 'upload' | 'calendar' | 'search' | 'workspaces' | 'notifications';

export type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
};

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{ userId: string; role: 'owner' | 'editor' | 'viewer'; email?: string }>;
  createdAt: string;
};

export type Folder = {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  noteId: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: string;
  mentions?: string[]; // user IDs or emails
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};
