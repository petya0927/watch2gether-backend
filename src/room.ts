import express from 'express';
import { createRoom, getRoom, isUsernameTaken } from './database.js';
import { logErrorToConsole } from './helperFunctions.js';

const router = express.Router();

router.post('/new', async (req, res) => {
  try {
    const videoUrl = req.body.videoUrl;
    const owner = req.body.owner;

    if (!videoUrl || !owner) {
      return res.status(400).json({ error: 'Missing videoUrl or owner' });
    }

    const id = await createRoom({ videoUrl, owner });

    if (!id) {
      return res.status(500).json({ error: 'Error creating room' });
    }

    return res.status(200).json({ id });
  } catch (error) {
    logErrorToConsole({ error, func: '/new' });
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;

    const room = await getRoom(roomId);

    if (room) {
      res.status(200).send({ room });
      return;
    } else {
      res.status(404).send('Room not found');
      return;
    }
  } catch (error) {
    logErrorToConsole({ error, func: '/:id' });
    res.status(404).send('Room not found');
  }
});

router.get('/:id/isUsernameTaken', async (req, res) => {
  try {
    const roomId = req.params.id;
    const username = req.query.username as string;

    const isTaken = await isUsernameTaken({ roomId, username });

    res.status(200).send({ isTaken });
  } catch (error) {
    logErrorToConsole({ error, func: '/:id/isUsernameTaken' });
    res.status(404).send('Room not found');
  }
});

export default router;
