const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS) || 10;
const COLLECTION = 'decks';

// Helper function to validate the deck
const validateDeck = async (deck, dbConnect) => {
  const heroCard = await dbConnect.collection('cards').findOne({ _id: deck.hero, type: 'hero' });
  if (!heroCard) {
    throw { code: 1, message: 'Invalid hero ID' };
  }

  if (Object.keys(deck.cards).length < 4) { 
    throw { code: 2, message: 'Deck must contain at least 5 cards' };
  }

  for (const [cardId, copies] of Object.entries(deck.cards)) {
    if (copies < 1 || copies > 3) {
      throw { code: 3, message: 'Each card must have between 1 and 3 copies' };
    }

    const card = await dbConnect.collection('cards').findOne({ _id: cardId });
    if (!card || card.type === 'hero') {
      throw { code: 4, message: `Invalid card ID or card is of type hero: ${cardId}` };
    }
  }
};

// addDeck()
router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();
  const deck = req.body;

  try {
    await validateDeck(deck, dbConnect);
    deck._id = deck.hero; // Set _id to the value of the hero card
    const result = await dbConnect.collection(COLLECTION).insertOne(deck);
    res.status(201).send(deck);
  } catch (error) {
    res.status(400).json({ code: error.code, message: error.message });
  }
});

// getDecks()
router.get('/', async (req, res) => {
  let limit = MAX_RESULTS;
  if (req.query.limit) {
    limit = Math.min(parseInt(req.query.limit), MAX_RESULTS);
  }
  let next = req.query.next;
  let query = {};
  if (next) {
    query = { _id: { $gt: next } }; // Using _id for pagination
  }
  const dbConnect = dbo.getDb();
  try {
    let results = await dbConnect
      .collection(COLLECTION)
      .find(query)
      .project({ name: 1, description: 1, hero: 1 }) // Only include name, description, and hero
      .sort({ _id: 1 }) // Sorting by _id
      .limit(limit)
      .toArray();

    next = results.length === limit ? results[results.length - 1]._id : null;
    res.status(200).json({ results, next });
  } catch (err) {
    res.status(400).send('Error searching for decks');
  }
});

// getDeckById()
router.get('/:heroID', async (req, res) => {
  const dbConnect = dbo.getDb();
  let query = { _id: req.params.heroID };

  try {
    let result = await dbConnect
      .collection(COLLECTION)
      .findOne(query);

    if (!result) {
      res.status(404).send('Not found');
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(400).send('Error retrieving the deck');
  }
});

// deleteDeckById()
router.delete('/:heroID', async (req, res) => {
  const query = { _id: req.params.heroID };
  const dbConnect = dbo.getDb();

  try {
    let result = await dbConnect
      .collection(COLLECTION)
      .deleteOne(query);

    if (result.deletedCount === 0) {
      res.status(404).send('Not found');
    } else {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(400).send('Error deleting the deck');
  }
});

module.exports = router;