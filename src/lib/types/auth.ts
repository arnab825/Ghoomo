export type EvaluatorRole = 'tourist' | 'vendor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: EvaluatorRole;
  avatarUrl?: string;
  isDemoAccount?: boolean;
}
