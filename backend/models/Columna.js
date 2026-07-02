const mongoose = require('mongoose');

const ColumnaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    colorClass: {
        type: String,
        required: true,
        trim: true
    },
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
        required: true
    },
    orden: {
        type: Number,
        default: 0
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Columna', ColumnaSchema);