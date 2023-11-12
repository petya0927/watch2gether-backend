import { Server, Socket } from 'socket.io';
import {
  addUserToRoom,
  getRoom,
  isUserInRoom,
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

  console.log(
    `User ${query.username} connected to room ${query.id} with socket id ${socket.id}`,
  );

  try {
    if (
      !(await isUserInRoom({
        roomId: query.id as string,
        user: {
          socketId: socket.id,
          username: query.username as string,
        },
      }))
    ) {
      await addUserToRoom({
        roomId: query.id as string,
        user: {
          socketId: socket.id,
          username: query.username as string,
        },
      });

      socket.join(query.id as string);
    } else {
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

  socket.emit('room-data', await getRoom(query.id as string));
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

    emitUserLeft(socket);

    console.log(
      `User ${query.username} disconnected from room ${query.id} with socket id ${socket.id}`,
    );
  } catch (error) {
    console.error(`Failed to remove user from room: ${error}`);
    socket.disconnect();
    return;
  }
};
