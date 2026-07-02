const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    contraseña: {
        type: String,
        required: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

// Método para verificar la contraseña
UsuarioSchema.methods.compararPassword = async function (passwordCandidata) {
    return await bcrypt.compare(passwordCandidata, this.contraseña);
};

// Hook pre-save para encriptar la contraseña si ha sido modificada
UsuarioSchema.pre('save', async function (next) {
    if (!this.isModified('contraseña')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.contraseña = await bcrypt.hash(this.contraseña, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);