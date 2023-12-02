import fs from 'fs';
import sqlite3 from 'sqlite3';
import { uid } from 'uid';
import { Room, RoomDatabase, User } from './types.js';

let db: sqlite3.Database;

const init = () => {
  const dbPath = './database/database.db';

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    console.log('Created database file.');
  }

  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }

    console.log('Connected to the database.');
  });

  let sql =
    'CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, videoUrl TEXT, owner TEXT, users TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)';

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Created rooms table.');
  });
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
  });
};

export const getRoom = (id: string): Promise<Room> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM rooms WHERE id = ?';

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

    db.get(sql, [roomId], (err, row: RoomDatabase) => {
      if (err) {
        console.error(err.message);
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

    db.get(sql, [roomId], (err, row: RoomDatabase) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      const users: User[] = JSON.parse(row.users);

      users.push(user);

      const updatedUsers = JSON.stringify(users);

      const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

      db.run(sql, [updatedUsers, roomId], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(`Added user ${user.username} to room ${roomId}.`);

        resolve();
      });
    });
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

    db.get(sql, [roomId], (err, row: RoomDatabase) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      const users = JSON.parse(row.users);

      const updatedUsers = users.filter(
        (u: User) => u.socketId !== user.socketId,
      );

      const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

      db.run(sql, [JSON.stringify(updatedUsers), roomId], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(`Removed user ${user.username} from room ${roomId}.`);

        resolve();
      });
    });
  });
};
