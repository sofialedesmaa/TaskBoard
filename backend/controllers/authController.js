const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Inyectar usuarios iniciales por defecto si la base de datos está vacía (Seeding)
const seedDefaultUsers = async () => {
    try {
        const count = await Usuario.countDocuments();
        if (count === 0) {
            const defaultUsers = [
                { nombre: 'Tobias', email: 'tobias@mediapila.com', contraseña: '12345' },
                { nombre: 'Rocio', email: 'rocio@mediapila.com', contraseña: '6789' },
                { nombre: 'Administrador', email: 'admin@mediapila.com', contraseña: 'admin' }
            ];
            
            for (const user of defaultUsers) {
                const nuevo = new Usuario(user);
                await nuevo.save();
            }
            console.log('Usuarios iniciales precargados con éxito.');
        }
    } catch (e) {
        console.error('Error al precargar usuarios de demo:', e);
    }
};

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Por favor, completa todos los campos.' });
        }

        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(400).json({ error: 'Este email ya está registrado.' });
        }

        const nuevoUsuario = new Usuario({
            nombre,
            email,
            contraseña: password
        });

        await nuevoUsuario.save();

        const token = jwt.sign({ id: nuevoUsuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email
        });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor al registrar usuario.' });
    }
};

// Inicio de sesión (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos.' });
        }

        await seedDefaultUsers();

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
        }

        const match = await usuario.compararPassword(password);
        if (!match) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
        }

        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            nombre: usuario.nombre,
            email: usuario.email
        });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
    }
};

// Validación de sesión
exports.validate = async (req, res) => {
    try {
        res.json({
            valido: true,
            usuario: {
                id: req.usuario._id,
                nombre: req.usuario.nombre,
                email: req.usuario.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al validar token.' });
    }
};

// Recuperación de contraseña
exports.recover = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email requerido.' });
        }

        await seedDefaultUsers();

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ error: 'No encontramos ninguna cuenta con ese email.' });
        }

        const defaultPasswords = {
            'tobias@mediapila.com': '12345',
            'rocio@mediapila.com': '6789',
            'admin@mediapila.com': 'admin'
        };

        if (defaultPasswords[email]) {
            return res.json({ password: defaultPasswords[email] });
        }

        usuario.contraseña = '12345';
        await usuario.save();

        res.json({ password: '12345' });
    } catch (error) {
        res.status(500).json({ error: 'Error al recuperar contraseña.' });
    }
};

exports.seedDefaultUsers = seedDefaultUsers;