// ==========================================
// 1. ESTADO Y CONFIGURACIÓN (VARIABLES)
// ==========================================
const API_BASE_URL = 'http://localhost:5000/api';

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
const mensajeRecover = document.getElementById("mensajeRecuperar"); // Se sincroniza el nombre para evitar conflictos

// ==========================================
// 3. FUNCIONES
// ==========================================

// Iniciar sesión principal
async function login() {
    const emailIngresado = inputEmail ? inputEmail.value.trim() : "";
    const pswIngresada = inputPassword ? inputPassword.value : "";

    if (!emailIngresado || !pswIngresada) {
        if (mensajeLogin) {
            mensajeLogin.innerHTML = '<div class="alert alert-danger">Por favor, ingresa email y contraseña.</div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailIngresado, password: pswIngresada })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar token y nombre de usuario en localStorage
            localStorage.setItem('token_mediaPila', data.token);
            localStorage.setItem('nombre_usuario', data.nombre);
            window.location.href = 'home.html';
        } else {
            if (mensajeLogin) {
                mensajeLogin.innerHTML = `<div class="alert alert-danger">${data.error || 'Email o contraseña incorrectos'}</div>`;
            }
        }
    } catch (err) {
        if (mensajeLogin) {
            mensajeLogin.innerHTML = '<div class="alert alert-danger">Error de conexión con el servidor.</div>';
        }
    }
}

// Crear cuenta de usuario
async function registrarUsuario() {
    const nombre = regNombre ? regNombre.value.trim() : "";
    const email = regEmail ? regEmail.value.trim() : "";
    const password = regPassword ? regPassword.value.trim() : "";

    if (!nombre || !email || !password) {
        if (mensajeRegistro) {
            mensajeRegistro.innerHTML = '<div class="alert alert-danger p-2 fs-7">Por favor, completa todos los campos.</div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar éxito en el login principal
            if (mensajeLogin) {
                mensajeLogin.innerHTML = '<div class="alert alert-success p-2">¡Cuenta creada con éxito! Ya puedes iniciar sesión.</div>';
            }
            limpiarFormularioRegistro();
            if (modalRegistroEl) {
                const modal = bootstrap.Modal.getInstance(modalRegistroEl) || new bootstrap.Modal(modalRegistroEl);
                modal.hide();
            }
        } else {
            if (mensajeRegistro) {
                mensajeRegistro.innerHTML = `<div class="alert alert-danger p-2 fs-7">${data.error || 'Error al registrar.'}</div>`;
            }
        }
    } catch (err) {
        if (mensajeRegistro) {
            mensajeRegistro.innerHTML = '<div class="alert alert-danger p-2 fs-7">Error de conexión con el servidor.</div>';
        }
    }
}

// Recuperar contraseña
async function recuperarPassword() {
    const email = recupEmail ? recupEmail.value.trim() : "";

    if (!email) {
        if (mensajeRecover) {
            mensajeRecover.innerHTML = '<div class="alert alert-danger p-2 fs-7">Por favor, ingresa tu email.</div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            if (mensajeRecover) {
                mensajeRecover.innerHTML = `<div class="alert alert-success p-2 fs-7">Tu contraseña es: <strong>${data.password}</strong></div>`;
            }
        } else {
            if (mensajeRecover) {
                mensajeRecover.innerHTML = `<div class="alert alert-danger p-2 fs-7">${data.error || 'Error al recuperar la contraseña.'}</div>`;
            }
        }
    } catch (err) {
        if (mensajeRecover) {
            mensajeRecover.innerHTML = '<div class="alert alert-danger p-2 fs-7">Error de conexión con el servidor.</div>';
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
