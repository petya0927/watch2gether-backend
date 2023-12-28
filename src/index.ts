import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import roomRouter from './room.js';
import {
  emitUserLeft,
  emitVideoPause,
  emitVideoPlay,
  emitVideoPlaybackRateChange,
  handleConnection,
  handleDisconnect,
  initSocket,
} from './socket.js';
import { init } from './database.js';
import { logErrorToConsole } from './helperFunctions.js';

const port = 8081 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = initSocket(server);

// config
app.use(express.json());
app.use(cors());

// routes
app.use('/room', roomRouter);

// socket
io.on('connection', async (socket) => {
  await handleConnection(socket);

  socket.on('video-play', (data) => {
    emitVideoPlay({ socket, data });
  });

  socket.on('video-pause', () => {
    emitVideoPause({ socket });
  });

  socket.on('video-playback-rate-change', (data) => {
    emitVideoPlaybackRateChange({ socket, data });
  });

  socket.on('disconnect', async () => {
    emitUserLeft(socket);
    await handleDisconnect(socket);
  });
});

const startServer = async () => {
  try {
    await init();

    server.listen(port, () => {
      console.log(`Server listening on port ${port} 🚀`);
    });
  } catch (error) {
    logErrorToConsole({ error, func: 'startServer' });
  }
};

startServer();
