export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
