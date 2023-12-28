import 'dotenv/config';
import {
  Collection,
  Db,
  MongoClient,
  ObjectId,
  ServerApiVersion,
} from 'mongodb';
import { log } from './helperFunctions.js';
import { Room, User } from './types.js';

let client: MongoClient | null = null;

let db: Db | null = null;
let roomsCollection: Collection | null = null;

const connectToDatabase = async (): Promise<MongoClient> => {
  log({ message: 'Connecting to database server... 📡' });

  client = new MongoClient(process.env.MONGODB_URI as string, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  db = client.db('test');
  roomsCollection = db.collection('rooms');

  log({ message: 'Connected to database server! 🎉', level: 'success' });
  return client;
};

export const kickAllUsers = async () => {
  const result = await roomsCollection?.updateMany(
    {
      users: { $exists: true },
    },
    { $set: { users: [] } },
  );

  if (result?.matchedCount) {
    log({
      message: `Kicked ${result.modifiedCount} users from ${result.matchedCount} rooms.`,
      level: 'success',
    });
  } else {
    throw new Error('Failed to kick users.');
  }
};

export const init = async () => {
  await connectToDatabase();

  await kickAllUsers();
};

export const createRoom = async ({
  videoUrl,
  owner,
}: {
  videoUrl: string;
  owner: string;
}): Promise<string> => {
  const result = await roomsCollection?.insertOne({
    videoUrl,
    owner,
    users: [],
    createdAt: new Date().toISOString(),
  });

  if (result?.insertedId) {
    log({
      message: `Created room with id ${result.insertedId}, videoUrl ${videoUrl}, owner ${owner}.`,
    });

    return result.insertedId.toString();
  } else {
    throw new Error(`Failed to create room (${videoUrl}, ${owner}).`);
  }
};

export const getRoom = async (id: string): Promise<Room> => {
  const objectId = new ObjectId(id);
  const room = await roomsCollection?.findOne<Room>({ _id: objectId });

  if (!room) {
    throw new Error(`Room ${id} not found.`);
  }

  return room;
};

export const isUsernameTaken = async ({
  roomId,
  username,
}: {
  roomId: string;
  username: string;
}): Promise<boolean> => {
  const room = await getRoom(roomId);

  const isTaken = room.users.find((user) => user.username === username);

  return !!isTaken;
};

export const addUserToRoom = async ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<boolean> => {
  const result = await roomsCollection?.updateOne(
    { _id: new ObjectId(roomId) },
    { $push: { users: user } },
  );

  if (result?.modifiedCount === 1) {
    log({
      message: `Added user ${user.username} to room ${roomId}.`,
    });
    return true;
  } else {
    throw new Error(`Failed to add user ${user.username} to room ${roomId}.`);
  }
};

export const removeUserFromRoom = async ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<boolean> => {
  const result = await roomsCollection?.updateOne(
    { _id: new ObjectId(roomId) },
    { $pull: { users: user } },
  );

  if (result?.modifiedCount === 1) {
    log({
      message: `Removed user ${user.username} from room ${roomId}.`,
    });
    return true;
  } else {
    throw new Error(
      `Failed to remove user ${user.username} from room ${roomId}.`,
    );
  }
};
