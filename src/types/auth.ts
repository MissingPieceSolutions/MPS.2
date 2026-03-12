export type Role = 'admin' | 'editor' | 'client';

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
