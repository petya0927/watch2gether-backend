import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import roomRouter from './room.js';
import {
  addUserToRoom,
  getRoom,
  isUserInRoom,
  removeUserFromRoom,
} from './database.js';

const port = 8081 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// config
app.use(express.json());
app.use(cors());

app.use('/room', roomRouter);

io.on('connection', async (socket) => {
  const query = socket.handshake.query;

  console.log(
    `User ${query.username} connected to room ${query.id} with socket id ${socket.id}`,
  );

  try {
    if (
      !(await isUserInRoom({
        id: query.id as string,
        user: query.username as string,
      }))
    ) {
      await addUserToRoom({
        id: query.id as string,
        user: query.username as string,
      });
    }
  } catch (error) {
    console.error(`Failed to add user to room: ${error}`);
    socket.disconnect();
    return;
  }

  socket.emit('room-data', {
    room: await getRoom(query.id as string),
  });

  socket.on('disconnect', async () => {
    console.log(
      `User ${query.username} disconnected from room ${query.id} with socket id ${socket.id}`,
    );

    try {
      await removeUserFromRoom({
        id: query.id as string,
        user: query.username as string,
      });
    } catch (error) {
      console.error(`Failed to remove user from room: ${error}`);
      socket.disconnect();
      return;
    }
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
