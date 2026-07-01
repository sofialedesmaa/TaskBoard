// Obtener usuarios de localStorage o usar por defecto
let usuarios = JSON.parse(localStorage.getItem('usuarios_registrados'));
if (!usuarios) {
    usuarios = [
        {
            email: 'tobias@mediapila.com',
            password: '12345',
            nombre: 'Tobias',
            token: 'token-tobias-abc123'
        },
        {
            email: 'rocio@mediapila.com',
            password: '6789',
            nombre: 'Rocio',
            token: 'token-rocio-xyz456'
        },
        {
            email: 'admin@mediapila.com',
            password: 'admin',
            nombre: 'Administrador',
            token: 'token-admin-999'
        }
    ];
    localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));
}

// Lista de todos los tokens válidos de forma dinámica
const tokens_validos = usuarios.map(u => u.token);

// Leo el token guardado en el navegador
const token = localStorage.getItem('token_mediaPila');

// En qué página estoy
const url = window.location.pathname.split("/").pop();

// includes() verifica si el token está dentro del array
const tokenEsValido = tokens_validos.includes(token);

if (tokenEsValido) {
    if (url === 'login.html' || url === 'index.html' || url === '') {
        window.location.href = 'home.html';
    }
} else {
    if (url !== 'login.html') {
        window.location.href = 'login.html';
    }
}

