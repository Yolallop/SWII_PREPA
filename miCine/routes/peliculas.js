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
  let next = req.query.next; 
  let query = {}
  if (next){
    query = {_id: {$lt: new ObjectId(next)}}
  }
  if (req.query.genero) {
    query.genero = req.query.genero;
  }
    
  if (req.query.edad_minima) {
    query.edad_minima = req.query.edad_minima;
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
  const dbConnect = dbo.getDb();
  const id = req.params.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await dbConnect.collection(COLLECTION).findOne(query);

    if (!result) {
      return res.status(404).send({ error: "Película no encontrada" });
    }

    res.status(200).send(result);
  } catch (err) {
    res.status(400).send({ error: "ID no válido" });
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


//updatePeliculaById()
router.put('/:id', async (req, res) => {
  const query = {_id: new ObjectId(req.params.id)};
  const update = {$set:{
    titulo: req.body.titulo,
    resumen: req.body.resumen,
    duracion: req.body.duracion
  }};
  try {
    let result = await dbConnect
      .collection(COLLECTION)
      .updateOne(query, update);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send({ error: "Error al actualizar la película" });
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
