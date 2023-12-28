import {
  MongoClient,
  ServerApiVersion,
  Db,
  Collection,
  ObjectId,
} from 'mongodb';
import { Room, User } from './types.js';
import 'dotenv/config';
import { logErrorToConsole } from './helperFunctions.js';

let client: MongoClient | null = null;

let db: Db | null = null;
let roomsCollection: Collection | null = null;

const connectToDatabase = async (): Promise<MongoClient> => {
  console.log('Connecting to database server... 📡');
  try {
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

    console.log('Connected successfully to database server 🎉');
    return client;
  } catch (error) {
    logErrorToConsole({ error, func: 'connectToDatabase' });
    throw error;
  }
};

export const kickAllUsers = async () => {
  const result = await roomsCollection?.updateMany(
    {
      users: { $exists: true },
    },
    { $set: { users: [] } },
  );

  if (result?.matchedCount) {
    console.log(`Kicked ${result.modifiedCount} users.`);
  } else {
    throw new Error('Failed to kick users.');
  }
};

export const init = async () => {
  try {
    await connectToDatabase();

    await kickAllUsers();
  } catch (error) {
    client?.close();

    logErrorToConsole({ error, func: 'init' });
    throw error;
  }
};

export const createRoom = async ({
  videoUrl,
  owner,
}: {
  videoUrl: string;
  owner: string;
}): Promise<string> => {
  try {
    const result = await roomsCollection?.insertOne({
      videoUrl,
      owner,
      users: [],
      createdAt: new Date().toISOString(),
    });

    if (result?.insertedId) {
      console.log(
        `Created room with id ${result.insertedId}, videoUrl ${videoUrl}, owner ${owner}.`,
      );

      return result.insertedId.toString();
    } else {
      throw new Error(`Failed to create room (${videoUrl}, ${owner}).`);
    }
  } catch (error) {
    logErrorToConsole({ error, func: 'createRoom' });
    throw error;
  }
};

export const getRoom = async (id: string): Promise<Room> => {
  try {
    const objectId = new ObjectId(id);
    const room = await roomsCollection?.findOne<Room>({ _id: objectId });

    if (!room) {
      throw new Error(`Room ${id} not found.`);
    }

    return room;
  } catch (error) {
    logErrorToConsole({ error, func: 'getRoom' });
    throw error;
  }
};

export const isUsernameTaken = async ({
  roomId,
  username,
}: {
  roomId: string;
  username: string;
}): Promise<boolean> => {
  try {
    const room = await getRoom(roomId);

    const isTaken = room.users.find((user) => user.username === username);

    return !!isTaken;
  } catch (error) {
    logErrorToConsole({ error, func: 'isUsernameTaken' });
    throw error;
  }
};

export const addUserToRoom = async ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<boolean> => {
  try {
    const result = await roomsCollection?.updateOne(
      { _id: new ObjectId(roomId) },
      { $push: { users: user } },
    );

    if (result?.modifiedCount === 1) {
      console.log(`Added user ${user.username} to room ${roomId}.`);
      return true;
    } else {
      throw new Error(`Failed to add user ${user.username} to room ${roomId}.`);
    }
  } catch (error) {
    logErrorToConsole({ error, func: 'addUserToRoom' });
    throw error;
  }
};

export const removeUserFromRoom = async ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<boolean> => {
  try {
    const result = await roomsCollection?.updateOne(
      { _id: new ObjectId(roomId) },
      { $pull: { users: user } },
    );

    if (result?.modifiedCount === 1) {
      console.log(`Removed user ${user.username} from room ${roomId}.`);
      return true;
    } else {
      throw new Error(
        `Failed to remove user ${user.username} from room ${roomId}.`,
      );
    }
  } catch (error) {
    logErrorToConsole({ error, func: 'removeUserFromRoom' });
    throw error;
  }
};
