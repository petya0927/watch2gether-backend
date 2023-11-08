import sqlite3 from 'sqlite3';
import { uid } from 'uid';
import { Room } from './types.js';
import fs from 'fs';

let db: sqlite3.Database;

const init = () => {
  const dbPath = './database.db';

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
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    let id = uid(16);
    let sql = 'SELECT id FROM rooms WHERE id = ?';

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      if (row) {
        id = uid(16);
      }

      sql = 'INSERT INTO rooms(id, videoUrl, owner, users) VALUES(?, ?, ?, ?)';

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
  });
};

export const getRoom = (id: string): Promise<Room> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM rooms WHERE id = ?';

    db.get(sql, [id], (err, row: Room) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      resolve(row);
    });
  });
};

export const addUserToRoom = ({
  id,
  user,
}: {
  id: string;
  user: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT users FROM rooms WHERE id = ?';

    db.get(sql, [id], (err, row: Room) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      const users = JSON.parse(row.users);

      users.push(user);

      const updatedUsers = JSON.stringify(users);

      const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

      db.run(sql, [updatedUsers, id], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(`Added user ${user} to room ${id}.`);

        resolve();
      });
    });
  });
};

export const removeUserFromRoom = ({
  id,
  user,
}: {
  id: string;
  user: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT users FROM rooms WHERE id = ?';

    db.get(sql, [id], (err, row: Room) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      const users = JSON.parse(row.users);

      const updatedUsers = users.filter((u: string) => u !== user);

      const sql = 'UPDATE rooms SET users = ? WHERE id = ?';

      db.run(sql, [JSON.stringify(updatedUsers), id], (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        console.log(`Removed user ${user} from room ${id}.`);

        resolve();
      });
    });
  });
};
