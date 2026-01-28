import { api } from './api';

export interface UserProfile {
  displayName: string;
  bio: string;
  avatarUrl: string;
  avatarEmoji: string;
}

export interface AcademicInfo {
  institution: string;
  major: string;
  year: string;
  expectedGraduation: string;
}

export interface CareerGoals {
  dreamRole: string;
  targetCompanies: string[];
  shortTermGoals: string;
  longTermGoals: string;
}

export interface CodingProfiles {
  leetcode: string;
  codeforces: string;
  github: string;
  linkedin: string;
  portfolio: string;
  twitter: string;
}

export interface Skills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  hobbies: string[];
}

export interface StudyPreferences {
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  dailyGoalHours: number;
  focusMode: boolean;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
}

export interface UserStats {
  totalTasks: number;
  archivedTasks: number;
  totalCompletions: number;
  daysActive: number;
  bestStreak: number;
  currentStreakMax: number;
  avgCompletionRate: number;
  productivityScore: number;
  thisWeekCompletions: number;
  accountAgeDays: number;
}

export interface FullUser {
  _id: string;
  username: string;
  email: string;
  isVerified: boolean;
  profile?: UserProfile;
  academic?: AcademicInfo;
  career?: CareerGoals;
  codingProfiles?: CodingProfiles;
  skills?: Skills;
  studyPreferences?: StudyPreferences;
  preferences?: Preferences;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  user: FullUser;
  stats: UserStats;
}

// Get full profile with stats
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get('/profile');
  return response.data;
};

// Update profile sections
export const updateProfile = async (data: {
  profile?: Partial<UserProfile>;
  academic?: Partial<AcademicInfo>;
  career?: Partial<CareerGoals>;
  codingProfiles?: Partial<CodingProfiles>;
  skills?: Partial<Skills>;
  studyPreferences?: Partial<StudyPreferences>;
  preferences?: Partial<Preferences>;
}): Promise<ProfileResponse> => {
  const response = await api.put('/profile', data);
  return response.data;
};

// Get stats only
export const getStats = async (): Promise<UserStats> => {
  const response = await api.get('/profile/stats');
  return response.data;
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.put('/profile/password', { currentPassword, newPassword });
  return response.data;
};

// Update username
export const updateUsername = async (username: string): Promise<{ message: string; username: string }> => {
  const response = await api.put('/profile/username', { username });
  return response.data;
};
