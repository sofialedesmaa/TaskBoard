// ==========================================
// 1. ESTADO Y CONFIGURACIÓN (VARIABLES)
// ==========================================
// Cargar usuarios de localStorage o inicializar la base de datos simulada por defecto
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

// ==========================================
// 2. ELEMENTOS DEL DOM (SELECTORES)
// ==========================================
// Formulario de Login principal
const inputEmail = document.getElementById("inputEmail");
const inputPassword = document.getElementById("inputPassword");
const mensajeLogin = document.getElementById("mensaje");

// Formulario de Registro (Modal)
const modalRegistroEl = document.getElementById("modalRegistro");
const regNombre = document.getElementById("regNombre");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const mensajeRegistro = document.getElementById("mensajeRegistro");

// Formulario de Recuperación (Modal)
const modalRecuperarEl = document.getElementById("modalRecuperar");
const recupEmail = document.getElementById("recupEmail");
const mensajeRecuperar = document.getElementById("mensajeRecuperar");


// ==========================================
// 3. FUNCIONES
// ==========================================

// Iniciar sesión principal
function login() {
    const emailIngresado = inputEmail ? inputEmail.value.trim() : "";
    const pswIngresada = inputPassword ? inputPassword.value : "";

    // Buscar en el array si existe un usuario con esos datos
    const usuarioEncontrado = usuarios.find(
        u => u.email === emailIngresado && u.password === pswIngresada
    );

    if (usuarioEncontrado) {
        // Guardar token y nombre de usuario en localStorage
        localStorage.setItem('token_mediaPila', usuarioEncontrado.token);
        localStorage.setItem('nombre_usuario', usuarioEncontrado.nombre);
        window.location.href = 'home.html';
    } else {
        if (mensajeLogin) {
            mensajeLogin.innerHTML = '<div class="alert alert-danger">Email o contraseña incorrectos</div>';
        }
    }
}

// Crear cuenta de usuario
function registrarUsuario() {
    const nombre = regNombre ? regNombre.value.trim() : "";
    const email = regEmail ? regEmail.value.trim() : "";
    const password = regPassword ? regPassword.value.trim() : "";

    if (!nombre || !email || !password) {
        if (mensajeRegistro) {
            mensajeRegistro.innerHTML = '<div class="alert alert-danger p-2 fs-7">Por favor, completa todos los campos.</div>';
        }
        return;
    }

    // Verificar si ya existe el correo
    const existe = usuarios.find(u => u.email === email);
    if (existe) {
        if (mensajeRegistro) {
            mensajeRegistro.innerHTML = '<div class="alert alert-danger p-2 fs-7">Este email ya está registrado.</div>';
        }
        return;
    }

    // Crear nuevo usuario
    const nuevoUsuario = {
        nombre: nombre,
        email: email,
        password: password,
        token: 'token-' + nombre.toLowerCase().replace(/\s+/g, '') + '-' + Math.random().toString(36).substr(2, 9)
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));

    // Mostrar éxito en el login principal
    if (mensajeLogin) {
        mensajeLogin.innerHTML = '<div class="alert alert-success p-2">¡Cuenta creada con éxito! Ya puedes iniciar sesión.</div>';
    }

    // Limpiar campos del modal
    limpiarFormularioRegistro();

    // Cerrar modal usando Bootstrap
    if (modalRegistroEl) {
        const modal = bootstrap.Modal.getInstance(modalRegistroEl) || new bootstrap.Modal(modalRegistroEl);
        modal.hide();
    }
}

// Recuperar contraseña
function recuperarPassword() {
    const email = recupEmail ? recupEmail.value.trim() : "";

    if (!email) {
        if (mensajeRecuperar) {
            mensajeRecuperar.innerHTML = '<div class="alert alert-danger p-2 fs-7">Por favor, ingresa tu email.</div>';
        }
        return;
    }

    const usuario = usuarios.find(u => u.email === email);
    if (usuario) {
        if (mensajeRecuperar) {
            mensajeRecuperar.innerHTML = '<div class="alert alert-success p-2 fs-7">Tu contraseña es: <strong>' + usuario.password + '</strong></div>';
        }
    } else {
        if (mensajeRecuperar) {
            mensajeRecuperar.innerHTML = '<div class="alert alert-danger p-2 fs-7">No encontramos ninguna cuenta con ese email.</div>';
        }
    }
}

// Funciones auxiliares de limpieza
function limpiarFormularioRegistro() {
    if (regNombre) regNombre.value = "";
    if (regEmail) regEmail.value = "";
    if (regPassword) regPassword.value = "";
    if (mensajeRegistro) mensajeRegistro.innerHTML = "";
}

function limpiarFormularioRecuperar() {
    if (recupEmail) recupEmail.value = "";
    if (mensajeRecuperar) mensajeRecuperar.innerHTML = "";
}


// ==========================================
// 4. EVENTOS Y LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Limpiar modal de recuperar contraseña al cerrarse
    if (modalRecuperarEl) {
        modalRecuperarEl.addEventListener('hidden.bs.modal', limpiarFormularioRecuperar);
    }

    // Limpiar modal de registro al cerrarse
    if (modalRegistroEl) {
        modalRegistroEl.addEventListener('hidden.bs.modal', limpiarFormularioRegistro);
    }
});

