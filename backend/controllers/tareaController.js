const Tarea = require('../models/Tarea');
const Columna = require('../models/Columna');

// Crear una nueva tarea
exports.createTask = async (req, res) => {
    try {
        const { title, description, labels, dueDate, priority, columnaId } = req.body;
        if (!title || !columnaId) {
            return res.status(400).json({ error: 'El título y columnaId son requeridos.' });
        }
        
        const col = await Columna.findById(columnaId).populate('proyecto');
        if (!col || col.proyecto.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(404).json({ error: 'Columna no encontrada o acceso no autorizado.' });
        }
        
        const nuevaTarea = new Tarea({
            titulo: title,
            descripcion: description || '',
            etiqueta: (labels && labels.length > 0) ? labels[0] : 'logo',
            prioridad: priority || 'Media',
            fechaVencimiento: dueDate || '',
            columna: columnaId
        });
        
        await nuevaTarea.save();
        
        res.status(201).json({
            id: nuevaTarea._id,
            title: nuevaTarea.titulo,
            description: nuevaTarea.descripcion,
            dueDate: nuevaTarea.fechaVencimiento,
            priority: nuevaTarea.prioridad,
            labels: nuevaTarea.etiqueta ? [nuevaTarea.etiqueta] : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear tarea.' });
    }
};

// Actualizar una tarea (o cambiar de columna en drag & drop)
exports.updateTask = async (req, res) => {
    try {
        const { title, description, labels, dueDate, priority, columnaId } = req.body;
        
        const tarea = await Tarea.findById(req.params.id).populate({
            path: 'columna',
            populate: { path: 'proyecto' }
        });
        
        if (!tarea || tarea.columna.proyecto.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(404).json({ error: 'Tarea no encontrada o acceso no autorizado.' });
        }
        
        if (title !== undefined) tarea.titulo = title;
        if (description !== undefined) tarea.descripcion = description;
        if (labels !== undefined) tarea.etiqueta = (labels && labels.length > 0) ? labels[0] : '';
        if (priority !== undefined) tarea.prioridad = priority;
        if (dueDate !== undefined) tarea.fechaVencimiento = dueDate;
        
        if (columnaId !== undefined) {
            const col = await Columna.findById(columnaId).populate('proyecto');
            if (!col || col.proyecto.usuario.toString() !== req.usuario._id.toString()) {
                return res.status(400).json({ error: 'Columna de destino no válida.' });
            }
            tarea.columna = columnaId;
        }
        
        await tarea.save();
        
        res.json({
            id: tarea._id,
            title: tarea.titulo,
            description: tarea.descripcion,
            dueDate: tarea.fechaVencimiento,
            priority: tarea.prioridad,
            labels: tarea.etiqueta ? [tarea.etiqueta] : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar tarea.' });
    }
};

// Eliminar una tarea
exports.deleteTask = async (req, res) => {
    try {
        const tarea = await Tarea.findById(req.params.id).populate({
            path: 'columna',
            populate: { path: 'proyecto' }
        });
        
        if (!tarea || tarea.columna.proyecto.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(404).json({ error: 'Tarea no encontrada o acceso no autorizado.' });
        }
        
        await Tarea.deleteOne({ _id: tarea._id });
        
        res.json({ message: 'Tarea eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar tarea.' });
    }
};