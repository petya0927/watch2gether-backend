import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import roomRouter from './room.js';

const port = 8081 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server);

// config
app.use(express.json());
app.use(cors());

app.use('/room', roomRouter);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
