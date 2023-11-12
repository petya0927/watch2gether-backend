import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import roomRouter from './room.js';
import {
  emitRoomData,
  emitUserJoined,
  handleConnection,
  handleDisconnect,
  initSocket,
} from './socket.js';

const port = 8081 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = initSocket(server);

// config
app.use(express.json());
app.use(cors());

app.use('/room', roomRouter);

io.on('connection', async (socket) => {
  await handleConnection(socket);

  emitRoomData(socket);

  emitUserJoined(socket);

  socket.on('disconnect', async () => {
    await handleDisconnect(socket);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
