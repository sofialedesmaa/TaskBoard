const mongoose = require('mongoose');

const TareaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    etiqueta: {
        type: String,
        default: 'logo'
    },
    prioridad: {
        type: String,
        default: 'Media'
    },
    fechaVencimiento: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        default: 'brief'
    },
    columna: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Columna',
        required: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tarea', TareaSchema);