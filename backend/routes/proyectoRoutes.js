const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyectoController');
const auth = require('../middleware/auth');

router.use(auth); // Proteger todos los endpoints de proyectos con auth middleware

router.get('/', proyectoController.getAllProjects);
router.get('/:id', proyectoController.getProjectById);
router.post('/', proyectoController.createProject);
router.put('/:id', proyectoController.updateProject);
router.delete('/:id', proyectoController.deleteProject);

module.exports = router;