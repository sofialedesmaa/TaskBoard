const express = require('express');
const router = express.Router();
const columnaController = require('../controllers/columnaController');
const auth = require('../middleware/auth');

router.use(auth); // Proteger todos los endpoints de columnas con auth middleware

router.post('/', columnaController.createColumn);
router.put('/:id', columnaController.updateColumn);
router.delete('/:id', columnaController.deleteColumn);

module.exports = router;