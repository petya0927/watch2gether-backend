import { Server, Socket } from 'socket.io';
import {
  addUserToRoom,
  getRoom,
  isUsernameTaken,
  removeUserFromRoom,
} from './database.js';

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
    if (
      !(await isUsernameTaken({
        roomId: query.id as string,
        username: query.username as string,
      }))
    ) {
      console.log(
        `User ${query.username} connected to room ${query.id} with socket id ${socket.id}`,
      );

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
    console.error(`Failed to add user to room: ${error}`);
    socket.disconnect();
    return;
  }
};

export const emitRoomData = async (socket: Socket) => {
  const query = socket.handshake.query;

  try {
    const room = await getRoom(query.id as string);
    socket.emit('room-data', room);
    return;
  } catch (error) {
    console.error(`Failed to get room data: ${error}`);
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

    console.log(
      `User ${query.username} disconnected from room ${query.id} with socket id ${socket.id}`,
    );
  } catch (error) {
    console.error(`Failed to remove user from room: ${error}`);
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

export const emitVideoPause = ({ socket }: { socket: Socket }) => {
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
