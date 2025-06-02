const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = "peliculas";

router.get('/', async (req, res) => {
  let limit = MAX_RESULTS;
  if (req.query.limit){
    limit =  Math.min(parseInt(req.query.limit), MAX_RESULTS);
  }
  let next = req.query.next; //paginacion es decir que le da id ultimo q toqeue sabes  //next ID deññ ultimo documento mostrado
  let query = {} // el objeto con los filtros de busqueda 
  if (next){
    query = {_id: {$lt: new ObjectId(next)}} // Si se recibió un parámetro ?next=..., se filtran las películas con _id < next, para mostrar solo las anteriores (orden descendente). Esto implementa paginación por cursor.
  }
  const dbConnect = dbo.getDb();
  let results = await dbConnect
    .collection(COLLECTION)
    .find(query)
    .sort({_id: -1})
    .limit(limit)
    .project({titulo:1})
    .toArray()
    .catch(err => res.status(400).send('Error al buscar películas'));
  next = results.length == limit ? results[results.length - 1]._id : null;
  res.json({results, next}).status(200);
});



//getPeliculaById()
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // 1) validar id
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID no válido' });
  }

  // 2) buscar
  try {
    const db = dbo.getDb();
    const pelicula = await db
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) });   // puedes añadir projection aquí

    if (!pelicula) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    return res.status(200).json(pelicula);

  } catch (err) {
    console.error('Error get /peliculas/:id', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});



// addPelicula()
router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();
  try {
    const result = await dbConnect
      .collection(COLLECTION)
      .insertOne(req.body);

    // Construimos la URL del nuevo recurso:
    const nuevaUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${result.insertedId}`;

    res.status(201).send({
      id: result.insertedId,
      url: nuevaUrl
    });

  } catch (err) {
    res.status(400).send('Error al insertar película');
  }
});
router.put('/:id', async (req, res) => {
  const dbConnect = dbo.getDb();
  const query = { _id: new ObjectId(req.params.id) };

  const update = {
    $set: {
      titulo: req.body.titulo,
      directores: req.body.directores,
      actores: req.body.actores,
      duracion: req.body.duracion,
      edad_min: req.body.edad_min,
      resumen: req.body.resumen,
      genero: req.body.genero,
      url_sesiones: req.body.url_sesiones
    }
  };

  try {
    await dbConnect.collection(COLLECTION).updateOne(query, update);

    const nuevaUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`;
    res.status(200).send({
      id: req.params.id,
      url: nuevaUrl
    });
  } catch (err) {
    res.status(400).send('Error al actualizar película');
  }
});


//deletePeliculaById()
router.delete('/:id', async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const dbConnect = dbo.getDb();

  try {
    const result = await dbConnect
      .collection(COLLECTION)
      .deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Película no encontrada" });
    }

    res.status(200).send({
      mensaje: "Película eliminada correctamente",
      result
    });
  } catch (err) {
    res.status(400).send({
      error: "Error al eliminar película",
      mensaje: err.message
    });
  }
});


module.exports = router;
