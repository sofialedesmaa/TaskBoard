require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { seedDefaultUsers } = require('./controllers/authController');

const connectDB = async () => {
    const db = require('./config/database');
    await db();
};

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/proyectos', require('./routes/proyectoRoutes'));
app.use('/api/columnas', require('./routes/columnaRoutes'));
app.use('/api/tareas', require('./routes/tareaRoutes'));

// Ruta de estado de la API
app.get('/', (req, res) => {
    res.json({ status: 'API de Katban funcionando correctamente' });
});

// Inicialización del servidor y conexión a base de datos
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await seedDefaultUsers(); // Precarga de usuarios de demo en MongoDB
    app.listen(PORT, () => {
        console.log(`Servidor de Katban corriendo en puerto ${PORT}`);
    });
};

startServer();