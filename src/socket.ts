import { Server, Socket } from 'socket.io';
import {
  addMessageToRoom,
  addUserToRoom,
  getRoom,
  isUsernameTaken,
  removeUserFromRoom,
} from './database.js';
import { log, logErrorToConsole } from './helperFunctions.js';
import { Message } from './types.js';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  return io;
};

export const handleConnection = async (socket: Socket) => {
  const query = socket.handshake.query;

  try {
    const isTaken = await isUsernameTaken({
      roomId: query.id as string,
      username: query.username as string,
    });
    if (!isTaken) {
      log({
        message: `User ${query.username} connected to room ${query.id} with socket id ${socket.id}`,
      });

      await addUserToRoom({
        roomId: query.id as string,
        user: {
          socketId: socket.id,
          username: query.username as string,
        },
      });

      socket.join(query.id as string);

      emitRoomData(socket);

      emitUserJoined(socket);

      return;
    } else {
      socket.emit('username-taken');
      socket.disconnect();
      return;
    }
  } catch (error) {
    logErrorToConsole({ error, func: 'handleConnection' });
    socket.disconnect();
    return;
  }
};

export const emitRoomData = async (socket: Socket) => {
  try {
    const query = socket.handshake.query;
    const room = await getRoom(query.id as string);
    socket.emit('room-data', room);
    return;
  } catch (error) {
    logErrorToConsole({ error, func: 'emitRoomData' });
    socket.disconnect();
    return;
  }
};

export const emitUserJoined = async (socket: Socket) => {
  const query = socket.handshake.query;

  socket.to(query.id as string).emit('user-joined', {
    socketId: socket.id,
    username: query.username,
  });
};

export const emitUserLeft = async (socket: Socket) => {
  const query = socket.handshake.query;

  socket.to(query.id as string).emit('user-left', {
    socketId: socket.id,
    username: query.username,
  });
};

export const handleDisconnect = async (socket: Socket) => {
  const query = socket.handshake.query;

  try {
    await removeUserFromRoom({
      roomId: query.id as string,
      user: {
        socketId: socket.id,
        username: query.username as string,
      },
    });

    log({
      message: `User ${query.username} disconnected from room ${query.id} with socket id ${socket.id}`,
    });
  } catch (error) {
    logErrorToConsole({ error, func: 'handleDisconnect' });
    socket.disconnect();
    return;
  }
};

export const emitVideoPlay = ({
  socket,
  data,
}: {
  socket: Socket;
  data: { played: number };
}) => {
  const query = socket.handshake.query;
  socket.to(query.id as string).emit('video-play', data);
};

export const emitVideoPause = (socket: Socket) => {
  const query = socket.handshake.query;
  socket.to(query.id as string).emit('video-pause');
};

export const emitVideoPlaybackRateChange = ({
  socket,
  data,
}: {
  socket: Socket;
  data: { playbackRate: number };
}) => {
  const query = socket.handshake.query;
  socket.to(query.id as string).emit('video-playback-rate-change', data);
};

export const emitMessage = async ({
  socket,
  data,
}: {
  socket: Socket;
  data: Message;
}) => {
  try {
    const query = socket.handshake.query;

    await addMessageToRoom({
      roomId: query.id as string,
      message: data,
    });

    socket.to(query.id as string).emit('message', data);
  } catch (error) {
    logErrorToConsole({ error, func: 'emitMessage' });
    socket.disconnect();
    return;
  }
};
