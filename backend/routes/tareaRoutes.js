const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const auth = require('../middleware/auth');

router.use(auth); // Proteger todos los endpoints de tareas con auth middleware

router.post('/', tareaController.createTask);
router.put('/:id', tareaController.updateTask);
router.delete('/:id', tareaController.deleteTask);

module.exports = router;