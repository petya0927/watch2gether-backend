export interface RoomDatabase {
  id: string;
  videoUrl: string;
  owner: string;
  users: string;
  createdAt: string;
}

export interface Room {
  id: string;
  videoUrl: string;
  owner: string;
  users: User[];
  createdAt: string;
}

export interface User {
  username: string;
  socketId: string;
}
