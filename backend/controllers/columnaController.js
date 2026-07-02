const Columna = require('../models/Columna');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

// Crear una nueva columna para un proyecto
exports.createColumn = async (req, res) => {
    try {
        const { nombre, colorClass, proyectoId } = req.body;
        if (!nombre || !colorClass || !proyectoId) {
            return res.status(400).json({ error: 'Nombre, colorClass y proyectoId son requeridos.' });
        }
        
        const proj = await Proyecto.findOne({ _id: proyectoId, usuario: req.usuario._id });
        if (!proj) {
            return res.status(404).json({ error: 'Proyecto no encontrado o acceso no autorizado.' });
        }
        
        const count = await Columna.countDocuments({ proyecto: proyectoId });
        
        const nuevaCol = new Columna({
            nombre,
            colorClass,
            proyecto: proyectoId,
            orden: count
        });
        
        await nuevaCol.save();
        
        res.status(201).json({
            id: nuevaCol._id,
            name: nuevaCol.nombre,
            colorClass: nuevaCol.colorClass,
            tasks: []
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear columna.' });
    }
};

// Editar columna (renombrar o cambiar color)
exports.updateColumn = async (req, res) => {
    try {
        const { nombre, colorClass, orden } = req.body;
        
        const col = await Columna.findById(req.params.id).populate('proyecto');
        if (!col || col.proyecto.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(404).json({ error: 'Columna no encontrada o acceso no autorizado.' });
        }
        
        if (nombre !== undefined) col.nombre = nombre;
        if (colorClass !== undefined) col.colorClass = colorClass;
        if (orden !== undefined) col.orden = orden;
        
        await col.save();
        
        res.json({
            id: col._id,
            name: col.nombre,
            colorClass: col.colorClass,
            orden: col.orden
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar columna.' });
    }
};

// Eliminar columna (borrado de tareas asociadas)
exports.deleteColumn = async (req, res) => {
    try {
        const col = await Columna.findById(req.params.id).populate('proyecto');
        if (!col || col.proyecto.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(404).json({ error: 'Columna no encontrada o acceso no autorizado.' });
        }
        
        await Tarea.deleteMany({ columna: col._id });
        await Columna.deleteOne({ _id: col._id });
        
        res.json({ message: 'Columna eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar columna.' });
    }
};