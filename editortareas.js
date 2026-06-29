/* 1. Esperar a que el HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Capturar los elementos del DOM que vamos a usar
    const formTarea = document.getElementById('form-tarea');
    const listaTareas = document.getElementById('lista-tareas');

    // Limpiar los bloques de ejemplo que dejamos en el HTML para arrancar vacíos
    listaTareas.innerHTML = '';

    // 3. Escuchar el evento 'submit' cuando se envía el formulario
    formTarea.addEventListener('submit', (evento) => {
        // Evitamos que la página se recargue (comportamiento por defecto de los formularios)
        evento.preventDefault();

        // 4. Capturar los valores de cada input
        const info = document.getElementById('info-tarea').value;
        const titulo = document.getElementById('titulo-tarea').value;
        const descripcion = document.getElementById('desc-tarea').value;
        const fecha = document.getElementById('fecha-tarea').value;
        const tipoPieza = document.getElementById('tipo-pieza').value;
        const estadoSelect = document.getElementById('estado-tarea');
        
        // Obtenemos el texto visible del estado (ej: ".En proceso") en vez del value
        const estadoTexto = estadoSelect.options[estadoSelect.selectedIndex].text;

        // 5. Crear el HTML para la nueva tarjeta de tarea
        const nuevaTarjeta = document.createElement('div');
        // Le agregamos las mismas clases de Bootstrap y CSS que ya usamos
        nuevaTarjeta.className = 'p-3 bg-light rounded-3 shadow-sm d-flex flex-column gap-1 animate-fade-in';
        
        // Estructura interna de la tarjeta con los datos capturados
        nuevaTarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <strong class="text-dark">${titulo}</strong>
                <span class="badge bg-secondary text-capitalize" style="font-size: 11px;">${tipoPieza}</span>
            </div>
            ${descripcion ? `<p class="text-muted small mb-1">${descripcion}</p>` : ''}
            <div class="d-flex justify-content-between align-items-center mt-2" style="font-size: 12px;">
                <span class="text-primary fw-semibold">${estadoTexto}</span>
                ${fecha ? `<span class="text-muted">📅 ${formatearFecha(fecha)}</span>` : ''}
            </div>
        `;

        // 6. Agregar la tarjeta al contenedor de la derecha
        listaTareas.appendChild(nuevaTarjeta);

        // 7. Resetear el formulario para que quede limpio para la próxima tarea
        formTarea.reset();
    });

    // Función auxiliar para que la fecha se vea más linda (DD/MM/AAAA)
    function formatearFecha(fechaInput) {
        if (!fechaInput) return '';
        const partes = fechaInput.split('-'); // El input date devuelve YYYY-MM-DD
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
});
*/
document.addEventListener('DOMContentLoaded', () => {
    const formTarea = document.getElementById('form-tarea');
    const listaTareas = document.getElementById('lista-tareas');
    
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
            tarjeta.className = 'p-3 bg-light rounded-3 shadow-sm d-flex flex-column gap-1 animate-fade-in mb-3';
            
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