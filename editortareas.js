document.addEventListener('DOMContentLoaded', () => {
    const formTarea = document.getElementById('form-tarea');
    const listaTareas = document.getElementById('lista-tareas');
    
    // Cargar el nombre del proyecto desde localStorage
    const txtProyectoNav = document.getElementById('nombre-proyecto-nav');
    const txtProyectoMain = document.getElementById('nombre-proyecto-main');
    
    let tituloGuardado = localStorage.getItem('tituloProyecto') || 
                         localStorage.getItem('nombreProyecto') || 
                         localStorage.getItem('proyecto');
    
    // Si no se encuentra con esas claves, buscamos si hay un objeto de proyecto guardado (ej. de otros ejercicios)
    if (!tituloGuardado) {
        const proyectoGuardadoRaw = localStorage.getItem('proyectoGuardado');
        if (proyectoGuardadoRaw) {
            try {
                const data = JSON.parse(proyectoGuardadoRaw);
                if (data) {
                    tituloGuardado = data.projectName || data.nombre || data.titulo;
                }
            } catch (e) {
                console.error("Error al parsear proyectoGuardado:", e);
            }
        }
    }

    if (tituloGuardado) {
        if (txtProyectoNav) txtProyectoNav.textContent = tituloGuardado;
        if (txtProyectoMain) txtProyectoMain.textContent = tituloGuardado.toUpperCase();
    }
    
    // 1. El proyecto arranca sin tareas cargadas (Array vacío)
    let tareas = [];

    // Variable para saber si estamos editando una tarea existente
    let editandoId = null;

    // 2. Función para mostrar (renderizar) las tareas en la columna derecha
    function renderizarTareas() {
        listaTareas.innerHTML = ''; // Limpiamos el contenedor

        // Si no hay ninguna tarea, mostramos el mensaje de "No hay tareas cargadas"
        if (tareas.length === 0) {
            listaTareas.innerHTML = `
                <div class="text-center my-5 text-muted">
                    <p class="fs-4 mb-1">📋</p>
                    <p class="small fw-medium">No hay tareas cargadas todavía.</p>
                </div>
            `;
            return;
        }

        tareas.forEach(tarea => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'p-3 bg-body-secondary border rounded-3 shadow-sm d-flex flex-column gap-1 animate-fade-in mb-3';
            
            tarjeta.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong class="text-dark d-block">${tarea.titulo}</strong>
                        <span class="badge bg-secondary text-capitalize mt-1" style="font-size: 10px;">${tarea.tipoPieza}</span>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary border-0 p-1 btn-editar" data-id="${tarea.id}" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0 p-1 btn-eliminar" data-id="${tarea.id}" title="Eliminar">❌</button>
                    </div>
                </div>
                ${tarea.descripcion ? `<p class="text-muted small my-2">${tarea.descripcion}</p>` : ''}
                <div class="d-flex justify-content-between align-items-center mt-2" style="font-size: 12px;">
                    <span class="text-primary fw-semibold">${tarea.estado}</span>
                    ${tarea.fecha ? `<span class="text-muted">📅 ${formatearFecha(tarea.fecha)}</span>` : ''}
                </div>
            `;

            listaTareas.appendChild(tarjeta);
        });

        asignarEventosBotones();
    }

    // 3. Función para capturar los clics en Editar y Eliminar
    function asignarEventosBotones() {
        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm('¿Estás seguro de que querés eliminar esta tarea?')) {
                    tareas = tareas.filter(t => t.id !== id);
                    renderizarTareas();
                }
            });
        });

        // Botones de editar
        document.querySelectorAll('.btn-editar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const tareaAEditar = tareas.find(t => t.id === id);

                if (tareaAEditar) {
                    // Pasar los datos de la tarjeta de nuevo al formulario
                    document.getElementById('titulo-tarea').value = tareaAEditar.titulo;
                    document.getElementById('desc-tarea').value = tareaAEditar.descripcion;
                    document.getElementById('fecha-tarea').value = tareaAEditar.fecha;
                    document.getElementById('tipo-pieza').value = tareaAEditar.tipoPieza;
                    
                    // Seleccionar el estado correspondiente en el select
                    const estadoSelect = document.getElementById('estado-tarea');
                    for (let i = 0; i < estadoSelect.options.length; i++) {
                        if (estadoSelect.options[i].text === tareaAEditar.estado) {
                            estadoSelect.selectedIndex = i;
                            break;
                        }
                    }

                    // Cambiar el modo a "editando"
                    editandoId = id;
                    document.querySelector('.btn-crear').textContent = "Guardar cambios";
                    document.getElementById('titulo-tarea').focus();
                }
            });
        });
    }

    // 4. Manejar el envío del formulario (Crear o Editar)
    formTarea.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const titulo = document.getElementById('titulo-tarea').value;
        const descripcion = document.getElementById('desc-tarea').value;
        const fecha = document.getElementById('fecha-tarea').value;
        const tipoPieza = document.getElementById('tipo-pieza').value;
        const estadoSelect = document.getElementById('estado-tarea');
        const estadoTexto = estadoSelect.options[estadoSelect.selectedIndex].text;

        if (editandoId !== null) {
            // MODO EDITAR: Modificar la tarea existente
            tareas = tareas.map(t => {
                if (t.id === editandoId) {
                    return { ...t, titulo, descripcion, fecha, tipoPieza, estado: estadoTexto };
                }
                return t;
            });
            editandoId = null;
            document.querySelector('.btn-crear').textContent = "Crear tarea";
        } else {
            // MODO CREAR: Añadir una nueva tarea al array
            const nuevaTarea = {
                id: Date.now(), // Genera un ID único basado en el tiempo
                titulo,
                descripcion,
                fecha,
                tipoPieza,
                estado: estadoTexto
            };
            tareas.push(nuevaTarea);
        }
        renderizarTareas();
        formTarea.reset();
        
        document.querySelectorAll('.select-placeholder').forEach(select => {
            select.style.color = "#a0a0a0";
        });
    });
    // Manejar el botón Cancelar del formulario
    document.querySelector('.btn-cancelar').addEventListener('click', () => {
        formTarea.reset();
        editandoId = null;
        document.querySelector('.btn-crear').textContent = "Crear tarea";
    });

    function formatearFecha(fechaInput) {
        if (!fechaInput) return '';
        const partes = fechaInput.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Dibujar las tareas iniciales al cargar la página por primera vez
    renderizarTareas();
});
// Cambia el color del select cuando el usuario selecciona una opción válida
function checkPlaceholder(selectElement) {
    if (selectElement.value !== "") {
        selectElement.style.color = "#333333"; // Color oscuro normal
    } else {
        selectElement.style.color = "#a0a0a0"; // Se mantiene gris placeholder
    }
}