export type UserRole = 'admin' | 'user' | 'fire' | 'police' | 'medical';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: any;
}

export type EmergencyType = 'fire' | 'crime' | 'medical';
export type AlertStatus = 'pending' | 'responding' | 'resolved';

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  type: EmergencyType;
  color: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  status: AlertStatus;
  timestamp: any;
  responderId?: string;
  responderName?: string;
  responseStartTime?: any;
  resolvedTime?: any;
  aiAnalysis?: string;
}

export interface SystemLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: any;
}

export interface FeedbackResponse {
  id: string;
  userId: string;
  easeOfUse: number;
  reliability: number;
  satisfaction: number;
  comments?: string;
  timestamp: any;
}