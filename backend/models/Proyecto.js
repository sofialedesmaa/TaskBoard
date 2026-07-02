const mongoose = require('mongoose');

const ProyectoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    imagen: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: 'colorBrief'
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Proyecto', ProyectoSchema);