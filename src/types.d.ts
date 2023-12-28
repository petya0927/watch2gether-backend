import { ObjectId } from 'mongodb';

export interface Room {
  _id: ObjectId;
  videoUrl: string;
  owner: string;
  users: User[];
  createdAt: string;
}

export interface User {
  username: string;
  socketId: string;
}
