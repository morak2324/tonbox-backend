export interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoUrl?: string;
  points: number;
  level: number;
  totalInvites?: number;
  isEarlyAdopter?: boolean;
  isBanned?: boolean;
  createdAt: any;
  lastActive?: any;
}