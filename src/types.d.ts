import { ObjectId } from 'mongodb';

export interface Room {
  _id: ObjectId;
  videoUrl: string;
  owner: string;
  users: User[];
  messages: Message[];
  createdAt: string;
}

export interface User {
  username: string;
  socketId: string;
}

export interface Message {
  id: string;
  username: string;
  message: string;
  createdAt: string;
}
