import sqlite3 from 'sqlite3';
import { uid } from 'uid';
import { Room } from './types.js';

let db: sqlite3.Database;

const init = () => {
  db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }

    console.log('Connected to the database.');
  });

  let sql =
    'CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, videoUrl TEXT, owner TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)';

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Created rooms table.');
  });
};

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

      sql = 'INSERT INTO rooms(id, videoUrl, owner) VALUES(?, ?, ?)';

      db.run(sql, [id, videoUrl, owner], (err) => {
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

init();
