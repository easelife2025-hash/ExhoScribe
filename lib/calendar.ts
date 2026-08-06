export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  source: 'google' | 'microsoft';
  meetLink?: string;
}

export async function fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // past 7 days
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // next 7 days
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }
    
    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || 'Untitled Event',
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      location: item.location,
      description: item.description,
      source: 'google',
      meetLink: item.hangoutLink,
    }));
  } catch (error) {
    console.error('Error fetching Google events:', error);
    return [];
  }
}

export async function fetchGoogleDriveRecording(accessToken: string, meetingTitle: string): Promise<string | null> {
  try {
    // Search for MP4 files in the "Meet Recordings" folder or matching the meeting title
    const query = `mimeType='video/mp4' and name contains '${meetingTitle.replace(/'/g, "\\'")}'`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&orderBy=createdTime desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Drive');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].webViewLink;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Google Drive recording:', error);
    return null;
  }
}

export async function fetchMicrosoftCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${timeMin}&endDateTime=${timeMax}&$top=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Microsoft Calendar events');
    }
    
    const data = await response.json();
    return (data.value || []).map((item: any) => ({
      id: item.id,
      title: item.subject || 'Untitled Event',
      start: item.start.dateTime + 'Z', // MS Graph returns UTC without Z if timezone is UTC
      end: item.end.dateTime + 'Z',
      location: item.location?.displayName,
      description: item.bodyPreview,
      source: 'microsoft',
      meetLink: item.onlineMeeting?.joinUrl,
    }));
  } catch (error) {
    console.error('Error fetching Microsoft events:', error);
    return [];
  }
}
