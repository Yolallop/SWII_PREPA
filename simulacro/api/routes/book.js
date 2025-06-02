const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = 'books';

router.get('/', async (req, res) => {

  let limit = MAX_RESULTS;
  if (req.query.limit){
    limit =  Math.min(parseInt(req.query.limit), MAX_RESULTS);
  }

  let next = req.query.next;
  let query = {};

  if (next){
    query._id = { $lt: new ObjectId(next) };
  }

  if (req.query.year) {
    const year = parseInt(req.query.year);
    if (!isNaN(year)) {
      query.year = year;
    } else {
      return res.status(422).json({ error: "El parámetro 'year' debe ser numérico" });
    }
  }
  

  const dbConnect = dbo.getDb();
  try {
    let results = await dbConnect
      .collection(COLLECTION)
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .project({ titulo: 1, author:1 })
      .toArray();

    next = results.length === limit ? results[results.length - 1]._id : null;

  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

  const resultsWithLinks = results.map(book => ({
    ...book,
    link: `${baseUrl}/${book._id}`
  }));
  res.status(200).json({ results:resultsWithLinks, next });
}
  catch (err) {
    res.status(400).send('Error al buscar libros');
  }
  
});
router.get('/:id', async (req, res) => {
  const dbConnect = dbo.getDb();
  const id = req.params.id;

  // Validación de formato de ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID no válido' }); // Error 400
  }

  try {
    const result = await dbConnect
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) });

    if (!result) {
      return res.status(404).json({ error: 'Libro no encontrado' }); // Error 404
    }

    res.status(200).json(result); // Éxito 200
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar el libro' });
  }
});
router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();
  const { titulo, author, year } = req.body;

  // Validación simple de campos requeridos
  if (!titulo || !author) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: titulo y author' });
  }

  const nuevoLibro = { titulo, author };

  // Solo añadir el campo 'year' si está presente
  if (year !== undefined) {
    nuevoLibro.year = year;
  }

  try {
    const result = await dbConnect.collection(COLLECTION).insertOne(nuevoLibro);

    // Devolver el objeto completo, como el schema Book
    res.status(201).json({
      _id: result.insertedId,
      ...nuevoLibro
    });

  } catch (err) {
    res.status(500).json({ error: 'Error al crear el libro' });
  }
});

router.put('/:id', async (req, res) => {
  const dbConnect = dbo.getDb();
  const { id } = req.params;

  // Validar el ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID no válido' });
  }

  const { titulo, author } = req.body;

  // Validar campos obligatorios
  if (!titulo || !author) {
    return res.status(400).json({ error: 'Faltan campos: titulo y author' });
  }

  const update = {
    titulo,
    author
  };

  try {
    const result = await dbConnect
      .collection('books') // o tu COLLECTION constante
      .updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    res.status(200).json({ message: 'Libro actualizado correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el libro' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Validación de ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID no válido' });
  }

  try {
    const dbConnect = dbo.getDb();
    const result = await dbConnect
      .collection('books')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    res.status(200).json({ message: 'Libro eliminado correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el libro' });
  }
});
module.exports = router;
