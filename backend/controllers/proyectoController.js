const Proyecto = require('../models/Proyecto');
const Columna = require('../models/Columna');
const Tarea = require('../models/Tarea');

const DEFAULT_COLUMNS = [
    { nombre: 'Brief', colorClass: 'colorBrief', orden: 0 },
    { nombre: 'En proceso', colorClass: 'colorProceso', orden: 1 },
    { nombre: 'Revisión del cliente', colorClass: 'colorRevision', orden: 2 },
    { nombre: 'Aprobado', colorClass: 'colorAprobado', orden: 3 }
];

// Obtener todos los proyectos del usuario logueado con sus columnas y tareas
exports.getAllProjects = async (req, res) => {
    try {
        const proyectos = await Proyecto.find({ usuario: req.usuario._id }).sort({ fechaCreacion: -1 });
        
        const proyectosCompletos = [];
        
        for (const proj of proyectos) {
            const columnas = await Columna.find({ proyecto: proj._id }).sort({ orden: 1 });
            const columnasMapeadas = [];
            
            for (const col of columnas) {
                const tareas = await Tarea.find({ columna: col._id }).sort({ fechaCreacion: 1 });
                const tareasMapeadas = tareas.map(t => ({
                    id: t._id,
                    title: t.titulo,
                    description: t.descripcion,
                    dueDate: t.fechaVencimiento,
                    priority: t.prioridad,
                    labels: t.etiqueta ? [t.etiqueta] : []
                }));
                
                columnasMapeadas.push({
                    id: col._id,
                    name: col.nombre,
                    colorClass: col.colorClass,
                    tasks: tareasMapeadas
                });
            }
            
            proyectosCompletos.push({
                id: proj._id,
                titulo: proj.titulo,
                imagen: proj.imagen,
                color: proj.color,
                columnas: columnasMapeadas,
                lastModified: proj.fechaCreacion.getTime()
            });
        }
        
        res.json(proyectosCompletos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proyectos.' });
    }
};

// Obtener un solo proyecto con sus columnas y tareas
exports.getProjectById = async (req, res) => {
    try {
        const proj = await Proyecto.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!proj) {
            return res.status(404).json({ error: 'Proyecto no encontrado.' });
        }
        
        const columnas = await Columna.find({ proyecto: proj._id }).sort({ orden: 1 });
        const columnasMapeadas = [];
        
        for (const col of columnas) {
            const tareas = await Tarea.find({ columna: col._id }).sort({ fechaCreacion: 1 });
            const tareasMapeadas = tareas.map(t => ({
                id: t._id,
                title: t.titulo,
                description: t.descripcion,
                dueDate: t.fechaVencimiento,
                priority: t.prioridad,
                labels: t.etiqueta ? [t.etiqueta] : []
            }));
            
            columnasMapeadas.push({
                id: col._id,
                name: col.nombre,
                colorClass: col.colorClass,
                tasks: tareasMapeadas
            });
        }
        
        res.json({
            id: proj._id,
            titulo: proj.titulo,
            imagen: proj.imagen,
            color: proj.color,
            columnas: columnasMapeadas,
            lastModified: proj.fechaCreacion.getTime()
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el proyecto.' });
    }
};

// Crear un proyecto nuevo (inicializa las columnas automáticas)
exports.createProject = async (req, res) => {
    try {
        const { titulo, imagen, color } = req.body;
        if (!titulo) {
            return res.status(400).json({ error: 'El título del proyecto es requerido.' });
        }
        
        const nuevoProyecto = new Proyecto({
            titulo,
            imagen: imagen || '',
            color: color || 'colorBrief',
            usuario: req.usuario._id
        });
        
        await nuevoProyecto.save();
        
        const columnasCreadas = [];
        for (const colDef of DEFAULT_COLUMNS) {
            const nuevaCol = new Columna({
                nombre: colDef.nombre,
                colorClass: colDef.colorClass,
                proyecto: nuevoProyecto._id,
                orden: colDef.orden
            });
            await nuevaCol.save();
            columnasCreadas.push({
                id: nuevaCol._id,
                name: nuevaCol.nombre,
                colorClass: nuevaCol.colorClass,
                tasks: []
            });
        }
        
        res.status(201).json({
            id: nuevoProyecto._id,
            titulo: nuevoProyecto.titulo,
            imagen: nuevoProyecto.imagen,
            color: nuevoProyecto.color,
            columnas: columnasCreadas,
            lastModified: nuevoProyecto.fechaCreacion.getTime()
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el proyecto.' });
    }
};

// Editar un proyecto existente
exports.updateProject = async (req, res) => {
    try {
        const { titulo, imagen, color } = req.body;
        
        const proj = await Proyecto.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!proj) {
            return res.status(404).json({ error: 'Proyecto no encontrado.' });
        }
        
        if (titulo !== undefined) proj.titulo = titulo;
        if (imagen !== undefined) proj.imagen = imagen;
        if (color !== undefined) proj.color = color;
        
        await proj.save();
        
        res.json({
            id: proj._id,
            titulo: proj.titulo,
            imagen: proj.imagen,
            color: proj.color
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el proyecto.' });
    }
};

// Eliminar un proyecto existente (borrado en cascada de columnas y tareas)
exports.deleteProject = async (req, res) => {
    try {
        const proj = await Proyecto.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!proj) {
            return res.status(404).json({ error: 'Proyecto no encontrado.' });
        }
        
        const columnas = await Columna.find({ proyecto: proj._id });
        const columnaIds = columnas.map(c => c._id);
        
        await Tarea.deleteMany({ columna: { $in: columnaIds } });
        await Columna.deleteMany({ proyecto: proj._id });
        await Proyecto.deleteOne({ _id: proj._id });
        
        res.json({ message: 'Proyecto eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el proyecto.' });
    }
};