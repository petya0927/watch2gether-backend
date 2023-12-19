import fs from 'fs';
import path, { dirname } from 'path';
import sqlite3 from 'sqlite3';
import { uid } from 'uid';
import { fileURLToPath } from 'url';
import { Room, RoomDatabase, User } from './types.js';

var db: sqlite3.Database | undefined = undefined;

const createDatabaseFile = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dbDir = path.join(__dirname, './database');
  const dbPath = path.join(dbDir, 'database.db');

  if (!fs.existsSync(dbDir)) {
    const err = fs.mkdirSync(dbDir, { recursive: true });
    if (err === undefined) {
      console.error(err);
      return undefined;
    }
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    console.log('Created database file.');
  }

  return dbPath;
};

const createRoomsTable = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let sql =
      'CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, videoUrl TEXT, owner TEXT, users TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)';

    if (db) {
      db.run(sql, (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }
        console.log('Created rooms table.');
        resolve();
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

const connectToDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dbPath = createDatabaseFile();
    if (!dbPath) {
      reject(new Error('Database path not found.'));
      return;
    }

    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      console.log('Connected to the database.');
      resolve();
    });
  });
};

export const kickAllUsers = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE rooms SET users = ?';

    if (db) {
      db.run(sql, [JSON.stringify([])], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(`Kicked all users due to server restart.`);

        resolve();
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

const init = async () => {
  try {
    await connectToDatabase();

    await createRoomsTable();

    await kickAllUsers();
  } catch (error) {
    console.error('Failed to connect to the database', error);
    throw error;
  }
};

init();

export const createRoom = ({
  videoUrl,
  owner,
}: {
  videoUrl: string;
  owner: string;
}): Promise<string | Error> => {
  return new Promise((resolve, reject) => {
    let id = uid(16);
    let sql =
      'INSERT INTO rooms(id, videoUrl, owner, users) VALUES(?, ?, ?, ?)';

    const users = JSON.stringify([]);

    if (db) {
      db.run(sql, [id, videoUrl, owner, users], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(
          `Created room with id ${id}, videoUrl ${videoUrl}, owner ${owner}.`,
        );

        resolve(id);
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

export const getRoom = (id: string): Promise<Room> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM rooms WHERE id = ?';

    if (db) {
      db.get(sql, [id], (err, row: RoomDatabase) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        if (!row) {
          console.error(`Room ${id} not found.`);
          reject(err);
          return;
        }

        const users: User[] = JSON.parse(row.users);

        resolve({
          ...row,
          users,
        });
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

export const isUsernameTaken = ({
  roomId,
  username,
}: {
  roomId: string;
  username: string;
}): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const sql = 'SELECT users FROM rooms WHERE id = ?';

    if (db) {
      db.get(sql, [roomId], (err, row: RoomDatabase) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return undefined;
        }

        if (!row) {
          console.error(`Room ${roomId} not found.`);
          reject(err);
          return undefined;
        }

        const users: User[] = JSON.parse(row.users);
        const foundUser: User | undefined = users.find(
          (u: User) => u.username === username,
        );

        if (foundUser !== undefined) {
          console.log(`Username ${username} is taken in room ${roomId}.`);
        }

        resolve(foundUser !== undefined);
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

export const addUserToRoom = ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT users FROM rooms WHERE id = ?';
    if (db) {
      db.get(sql, [roomId], (err, row: RoomDatabase) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        if (!row) {
          console.error(`Room ${roomId} not found.`);
          reject(err);
          return;
        }

        const users: User[] = JSON.parse(row.users);

        users.push(user);

        const updatedUsers = JSON.stringify(users);

        const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

        if (db) {
          db.run(sql, [updatedUsers, roomId], (err) => {
            if (err) {
              console.error(err.message);
              reject(err);
              return;
            }

            console.log(`Added user ${user.username} to room ${roomId}.`);

            resolve();
          });
        }
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};

export const removeUserFromRoom = ({
  roomId,
  user,
}: {
  roomId: string;
  user: User;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT users FROM rooms WHERE id = ?';

    if (db) {
      db.get(sql, [roomId], (err, row: RoomDatabase) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        if (!row) {
          console.error(`Room ${roomId} not found.`);
          reject(err);
          return;
        }

        const users = JSON.parse(row.users);

        const updatedUsers = users.filter(
          (u: User) => u.socketId !== user.socketId,
        );

        const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

        if (db) {
          db.run(sql, [JSON.stringify(updatedUsers), roomId], (err) => {
            if (err) {
              console.error(err.message);
              reject(err);
              return;
            }

            console.log(`Removed user ${user.username} from room ${roomId}.`);

            resolve();
          });
        }
      });
    } else {
      reject(new Error('Database not initialized.'));
    }
  });
};
