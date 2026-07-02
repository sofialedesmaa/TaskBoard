const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // 1. Verificar si es un token simulado antiguo (ej: token-tobias-abc123 o token-nombre-xxxx)
        if (token.startsWith('token-')) {
            const parts = token.split('-');
            const nombreSimulado = parts[1]; // tobias, rocio, admin, etc.
            
            let usuario = await Usuario.findOne({ 
                $or: [
                    { email: new RegExp(nombreSimulado, 'i') },
                    { nombre: new RegExp(nombreSimulado, 'i') }
                ]
            });
            
            if (!usuario) {
                return res.status(401).json({ error: 'Token simulado no válido o usuario no encontrado.' });
            }
            
            req.usuario = usuario;
            req.token = token;
            return next();
        }

        // 2. Esquema JWT estándar
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await Usuario.findOne({ _id: decoded.id });

        if (!usuario) {
            return res.status(401).json({ error: 'Sesión no válida.' });
        }

        req.usuario = usuario;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token no válido.' });
    }
};

module.exports = auth; 