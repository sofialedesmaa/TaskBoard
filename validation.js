// Leo el token guardado en el navegador y la página actual
const token = localStorage.getItem('token_mediaPila');
const url = window.location.pathname.split("/").pop();

// Función asíncrona para validar token contra el servidor Node/Express
async function validarSesion() {
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Si no hay token, no es válido
    if (!token) {
        handleInvalidSession();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Token válido: redirigir a home si intenta acceder al login/index
            if (url === 'login.html' || url === 'index.html' || url === '') {
                window.location.href = 'home.html';
            }
        } else {
            // Token inválido/expirado
            handleInvalidSession();
        }
    } catch (e) {
        // En caso de caída del servidor, permitimos seguir de forma temporal si es un token de demo local
        if (token && token.startsWith('token-')) {
            if (url === 'login.html' || url === 'index.html' || url === '') {
                window.location.href = 'home.html';
            }
        } else {
            handleInvalidSession();
        }
    }
}

function handleInvalidSession() {
    if (url !== 'login.html' && url !== 'index.html' && url !== '') {
        // Limpiamos tokens expirados
        localStorage.removeItem('token_mediaPila');
        localStorage.removeItem('nombre_usuario');
        window.location.href = 'login.html';
    }
}

// Inicializar validación asíncrona
validarSesion();
