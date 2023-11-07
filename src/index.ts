import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import roomRouter from './room.js';
import { addUserToRoom, removeUserFromRoom } from './database.js';

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

io.on('connection', (socket) => {
  const query = socket.handshake.query;

  console.log(`User connected: ${socket.id}, ${query.id}, ${query.username}`);

  addUserToRoom({
    id: query.id as string,
    user: query.username as string,
  });

  socket.on('disconnect', () => {
    console.log(
      `User disconnected: ${socket.id}, ${query.id}, ${query.username}`,
    );

    removeUserFromRoom({
      id: query.id as string,
      user: query.username as string,
    });
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
