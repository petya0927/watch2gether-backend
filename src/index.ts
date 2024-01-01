import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import roomRouter from './room.js';
import {
  emitMessage,
  emitUserLeft,
  emitVideoPause,
  emitVideoPlay,
  emitVideoPlaybackRateChange,
  handleConnection,
  handleDisconnect,
  initSocket,
} from './socket.js';
import { init } from './database.js';
import { log, logErrorToConsole } from './helperFunctions.js';

const port = 8081 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = initSocket(server);

// config
app.use(express.json());

const allowedOrigins = [
  /localhost(:\d+)?$/,
  /^https?:\/\/watch2gether-frontend.vercel.app$/,
  /^https?:\/\/watch2gether-frontend-git-([a-zA-Z0-9_-]+)-petya0927\.vercel\.app$/,
  /^https?:\/\/watch2gether-frontend-([a-zA-Z0-9]{9})-petya0927\.vercel\.app$/,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((allowedOrigin) => {
          if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          } else {
            return allowedOrigin === origin;
          }
        })
      ) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);

// routes
app.use('/room', roomRouter);

// socket
io.on('connection', async (socket) => {
  await handleConnection(socket);

  socket.on('video-play', (data) => {
    emitVideoPlay({ socket, data });
  });

  socket.on('video-pause', () => {
    emitVideoPause(socket);
  });

  socket.on('video-playback-rate-change', (data) => {
    emitVideoPlaybackRateChange({ socket, data });
  });

  socket.on('message', (data) => {
    emitMessage({ socket, data });
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
      log({
        message: `Server listening on port ${port}! 🚀`,
        level: 'success',
      });
    });
  } catch (error) {
    logErrorToConsole({ error, func: 'startServer' });
  }
};

startServer();
