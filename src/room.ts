import express from 'express';
import { createRoom, getRoom } from './database.js';
const router = express.Router();

router.get('/:id', async (req, res) => {
  const roomId = req.params.id;

  const room = await getRoom(roomId);

  if (room) {
    res.status(200).send({ room });
    return;
  }

  res.status(404).send('Room not found');
});

// create a new room
router.post('/new', async (req, res) => {
  const videoUrl = req.body.videoUrl;
  const owner = req.body.owner;

  const roomId = await createRoom({ videoUrl, owner });

  if (roomId) {
    res.status(200).send({ roomId });
    return;
  }

  res.status(500).send('Error creating room');
});

export default router;
