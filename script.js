/* ============================================================
   1. CONSTANTES Y VARIABLES
   ============================================================ */
const STORE = 'taskboard_state';
const COLORS = ['colorBrief', 'colorProceso', 'colorRevision', 'colorAprobado'];
const DEFAULT_COLUMNS = [
    ['Brief', COLORS[0]],
    ['En proceso', COLORS[1]],
    ['Revisión del cliente', COLORS[2]],
    ['Aprobado', COLORS[3]]
];
const LABELS = [
    ['UI', 'colorBrief text-dark'],
    ['Redes', 'colorProceso text-dark'],
    ['Logo', 'colorAprobado text-dark'],
    ['Banner', 'colorRevision text-dark']
].map(([name, badgeClass]) => ({ name, badgeClass }));

let boardState = { columns: [], projectTitle: 'Titulo del proyecto 1' };
let currentProjectId = null;
let draggedTaskId = null;
let draggedFromColumnId = null;

/* ============================================================
   2. SELECTORES DEL DOM
   ============================================================ */
const DOM = {
  boardContainer: null,
  projectTitle: null,
  navbarProjectTitle: null,
  searchProjectsInput: null,
  clearProjectsBtn: null,
  searchTasksInput: null,
  clearTasksBtn: null,
  nombreUsuarioEl: null,
  editorNavTitle: null,
  editorMainTitle: null,
  formTarea: null,
  tituloTarea: null,
  fechaTarea: null,
  tipoPieza: null,
  estadoTarea: null,
  listaTareas: null,
  btnCancelar: null
};

function cacheDOMSelectors() {
  DOM.boardContainer = $('#board-container');
  DOM.projectTitle = $('#project-title');
  DOM.navbarProjectTitle = $('#navbar-project-title');
  DOM.searchProjectsInput = $('#search-projects-input');
  DOM.clearProjectsBtn = $('#clear-projects-btn');
  DOM.searchTasksInput = $('#search-tasks-input');
  DOM.clearTasksBtn = $('#clear-tasks-btn');
  DOM.nombreUsuarioEl = document.getElementById('nombreUsuario');
  DOM.editorNavTitle = $('#nombre-proyecto-nav');
  DOM.editorMainTitle = $('#nombre-proyecto-main');
  DOM.formTarea = $('#form-tarea');
  DOM.tituloTarea = $('#titulo-tarea');
  DOM.fechaTarea = $('#fecha-tarea');
  DOM.tipoPieza = $('#tipo-pieza');
  DOM.estadoTarea = $('#estado-tarea');
  DOM.listaTareas = $('#lista-tareas');
  DOM.btnCancelar = $('.btn-cancelar');
}

/* ============================================================
   3. HELPERS / UTILIDADES
   ============================================================ */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const id = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
// NUEVA: Retorna la clave de localStorage específica para el usuario logueado en base a su token
function getProjectsStorageKey() {
    const token = localStorage.getItem('token_mediaPila');
    return token ? `katban_projects_${token}` : 'katban_projects';
}

// MODIFICADO: Guarda los cambios del proyecto activo respetando la nueva estructura { id, titulo, imagen, columnas }
const saveToLocalStorage = () => {
    if (!currentProjectId) return;
    let projects = getNormalizedProjects();
    let idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
        projects[idx].titulo = boardState.projectTitle;
        projects[idx].columnas = boardState.columns;
        projects[idx].lastModified = Date.now();
    } else {
        projects.push({
            id: currentProjectId,
            titulo: boardState.projectTitle,
            imagen: '',
            columnas: boardState.columns,
            lastModified: Date.now()
        });
    }
    localStorage.setItem(getProjectsStorageKey(), JSON.stringify(projects));
};
const byId = (items, itemId) => items.find(item => item.id === itemId);
const make = (tag, className = '', html = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
};

// Utilidad extra
function checkPlaceholder(selectElement) {
    if (selectElement.value !== "") {
        selectElement.style.color = "#333333";
    } else {
        selectElement.style.color = "#a0a0a0";
    }
}

/* ============================================================
   4. FUNCIONES — Sesión y Autenticación
   ============================================================ */
function initSession() {
    if (DOM.nombreUsuarioEl) {
        const nombre = localStorage.getItem('nombre_usuario');
        if (nombre) {
            DOM.nombreUsuarioEl.textContent = nombre;
        }
    }
}

function logout() {
    localStorage.removeItem('token_mediaPila');
    localStorage.removeItem('nombre_usuario');
    window.location.href = 'login.html';
}

/* ============================================================
   5. FUNCIONES — Persistencia
   ============================================================ */
// MODIFICADO: Retorna los proyectos de ejemplo solicitados para primer ingreso (Café Aurora, TechNova, WalletPro) con sus tareas, prioridades y deadlines
function getDemoProjects() {
    const defaultCols = [
        { name: 'Brief', colorClass: 'colorBrief' },
        { name: 'En proceso', colorClass: 'colorProceso' },
        { name: 'Revisión del cliente', colorClass: 'colorRevision' },
        { name: 'Aprobado', colorClass: 'colorAprobado' }
    ];

    const demo = [
        {
            titulo: 'Rebranding Café Aurora',
            imagen: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
            tasksByColumn: {
                'Brief': [
                    { title: 'Definir concepto visual de la nueva marca', labels: ['Logo'], priority: 'Media', dueDate: '2026-07-04', description: '' }
                ],
                'En proceso': [
                    { title: 'Diseñar primeras propuestas de logotipo', labels: ['Logo'], priority: 'Alta', dueDate: '2026-07-07', description: '' },
                    { title: 'Crear paleta de colores corporativa', labels: ['Logo'], priority: 'Media', dueDate: '2026-07-08', description: '' }
                ],
                'Revisión del cliente': [
                    { title: 'Ajustar isotipo según comentarios del cliente', labels: ['Logo'], priority: 'Alta', dueDate: '2026-07-10', description: '' }
                ],
                'Aprobado': [
                    { title: 'Entregar manual básico de identidad', labels: ['Logo'], priority: 'Baja', dueDate: '2026-07-12', description: '' }
                ]
            }
        },
        {
            titulo: 'Landing Page TechNova',
            imagen: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
            tasksByColumn: {
                'Brief': [
                    { title: 'Analizar requerimientos UX', labels: ['UI'], priority: 'Media', dueDate: '2026-07-05', description: '' }
                ],
                'En proceso': [
                    { title: 'Wireframes de escritorio', labels: ['UI'], priority: 'Alta', dueDate: '2026-07-09', description: '' },
                    { title: 'Diseño responsive mobile', labels: ['UI'], priority: 'Alta', dueDate: '2026-07-11', description: '' }
                ],
                'Revisión del cliente': [
                    { title: 'Correcciones de navegación solicitadas', labels: ['UI'], priority: 'Muy Alta', dueDate: '2026-07-13', description: '' }
                ],
                'Aprobado': [
                    { title: 'Diseño final aprobado', labels: ['UI'], priority: 'Baja', dueDate: '2026-07-15', description: '' }
                ]
            }
        },
        {
            titulo: 'App Financiera WalletPro',
            imagen: 'https://images.unsplash.com/photo-1559526324-5f3de0f0d410?w=600&auto=format&fit=crop&q=80',
            tasksByColumn: {
                'Brief': [
                    { title: 'Reunión inicial con producto', labels: ['UI'], priority: 'Media', dueDate: '2026-07-04', description: '' }
                ],
                'En proceso': [
                    { title: 'Dashboard principal', labels: ['UI'], priority: 'Alta', dueDate: '2026-07-08', description: '' },
                    { title: 'Pantalla de movimientos', labels: ['UI'], priority: 'Media', dueDate: '2026-07-10', description: '' }
                ],
                'Revisión del cliente': [
                    { title: 'Ajustar componentes según feedback', labels: ['UI'], priority: 'Muy Alta', dueDate: '2026-07-12', description: '' }
                ],
                'Aprobado': [
                    { title: 'Sistema visual aprobado', labels: ['UI'], priority: 'Baja', dueDate: '2026-07-14', description: '' }
                ]
            }
        }
    ];

    return demo.map((p, index) => {
        const columns = defaultCols.map(col => {
            const rawTasks = p.tasksByColumn[col.name] || [];
            const tasks = rawTasks.map(t => ({
                id: id(),
                title: t.title,
                labels: t.labels,
                dueDate: t.dueDate,
                description: t.description || '',
                priority: t.priority
            }));
            return {
                id: id(),
                name: col.name,
                colorClass: col.colorClass,
                tasks: tasks
            };
        });

        return {
            id: id(),
            titulo: p.titulo,
            imagen: p.imagen,
            columnas: columns,
            lastModified: Date.now() - (index * 1000)
        };
    });
}

// MODIFICADO: Recupera y normaliza los proyectos guardados en localStorage para garantizar compatibilidad con formatos heredados (state)
function getNormalizedProjects() {
    const key = getProjectsStorageKey();
    let projects = JSON.parse(localStorage.getItem(key)) || [];
    let needsSave = false;

    projects = projects.map(p => {
        if (p.titulo !== undefined && p.columnas !== undefined) {
            return p;
        }

        needsSave = true;
        return {
            id: p.id || id(),
            titulo: (p.state && p.state.projectTitle) || 'Sin título',
            imagen: p.imagen || '',
            columnas: (p.state && p.state.columns) || DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] })),
            lastModified: p.lastModified || Date.now()
        };
    });

    if (needsSave) {
        localStorage.setItem(key, JSON.stringify(projects));
    }
    return projects;
}

// MODIFICADO: Migra el antiguo estado a la nueva estructura unificada
function migrateOldData() {
    let oldState = localStorage.getItem('taskboard_state');
    const key = getProjectsStorageKey();
    let projects = JSON.parse(localStorage.getItem(key)) || [];
    if (oldState) {
        try {
            let parsedOld = JSON.parse(oldState);
            projects.push({
                id: id(),
                titulo: parsedOld.projectTitle || 'Sin título',
                imagen: '',
                columnas: parsedOld.columns || [],
                lastModified: Date.now()
            });
            localStorage.removeItem('taskboard_state');
            localStorage.setItem(key, JSON.stringify(projects));
        } catch (e) {}
    }
}

// MODIFICADO: Carga el proyecto activo utilizando la nueva estructura { id, titulo, columnas, imagen }
function loadFromLocalStorage() {
    migrateOldData();
    const key = getProjectsStorageKey();
    let projects = getNormalizedProjects();
    
    // Si no hay ningún proyecto, precargar los de demostración
    if (projects.length === 0) {
        projects = getDemoProjects();
        localStorage.setItem(key, JSON.stringify(projects));
    }

    const params = new URLSearchParams(window.location.search);
    const isHome = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('PRUEBA3');
    
    if (isHome) return true;

    if (params.get('new') === '1') {
        window.location.href = 'home.html?new=1';
        return false;
    }

    let reqId = params.get('id');
    if (reqId) {
        let proj = projects.find(p => p.id === reqId);
        if (proj) {
            currentProjectId = proj.id;
            boardState = {
                columns: proj.columnas || [],
                projectTitle: proj.titulo || 'Sin título'
            };
            normalizeDefaultColumnNames();
            return true;
        }
    }
    
    if (projects.length > 0) {
        projects.sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0));
        currentProjectId = projects[0].id;
        boardState = {
            columns: projects[0].columnas || [],
            projectTitle: projects[0].titulo || 'Sin título'
        };
        window.history.replaceState({}, '', window.location.pathname + '?id=' + currentProjectId);
        normalizeDefaultColumnNames();
        return true;
    }

    return false;
}

// MODIFICADO: Normaliza los nombres de columnas para que coincidan con los del sistema y guarda los cambios
function normalizeDefaultColumnNames() {
    boardState.columns.forEach(column => {
        if (['Revision', 'Revisión'].includes(column.name)) column.name = 'Revisión del cliente';
        if (column.name === 'En Proceso') column.name = 'En proceso';
    });
    saveToLocalStorage();
}

/* ============================================================
   6. FUNCIONES — Fechas
   ============================================================ */
function getRelativeDateText(dateString) {
    if (!dateString) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((new Date(`${dateString}T00:00:00`) - today) / 86400000);
    if (diffDays < 0) return { text: `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}`, cssClass: 'text-danger' };
    if (!diffDays) return { text: 'Vence hoy', cssClass: 'text-danger' };
    if (diffDays === 1) return { text: 'Vence mañana', cssClass: 'text-warning' };
    return { text: `Vence en ${diffDays} días`, cssClass: 'text-secondary' };
}

/* ============================================================
   7. FUNCIONES — Renderizado
   ============================================================ */
function renderBoard() {
    if (!DOM.boardContainer) return;
    DOM.boardContainer.replaceChildren(...boardState.columns.map(createColumnElement));

    const parent = DOM.boardContainer.parentElement;
    $('#btn-add-column', parent)?.remove();
    const controls = make('div', 'position-relative d-flex justify-content-center align-items-center mt-3 mb-4', `
    <a href="home.html" class="btn btn-link text-decoration-none text-secondary px-0 position-absolute start-0">
      <i class="bi bi-chevron-left"></i> Volver a mis proyectos
    </a>
    <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-3 px-4 py-2 btn-dashed">
      <i class="bi bi-plus"></i> Añadir columna
    </button>`);
    controls.id = 'btn-add-column';
    $('button', controls).addEventListener('click', promptAddColumn);
    parent.appendChild(controls);
}

function createColumnElement(column) {
    const col = make('div', 'card bg-light shadow rounded-3 column-width border-0');
    col.dataset.columnId = column.id;
    col.addEventListener('dragover', e => (e.preventDefault(), e.dataTransfer.dropEffect = 'move'));
    col.addEventListener('drop', e => {
        e.preventDefault();
        if (draggedTaskId && draggedFromColumnId) moveTask(draggedFromColumnId, column.id, draggedTaskId, null);
    });

    const header = make('div', `card-header d-flex align-items-center justify-content-between ${column.colorClass} rounded-top-3`, `
    <h5 class="mb-0 text-white fw-semibold editable-title" contenteditable="true" spellcheck="false" data-column-id="${column.id}">${column.name}</h5>
    <div class="d-flex align-items-center gap-2">
      <span class="badge bg-light text-dark rounded-pill">${column.tasks.length}</span>
      <button class="btn btn-sm p-0 text-white border-0" title="Eliminar columna" data-action="delete-column"><i class="bi bi-x-lg"></i></button>
    </div>`);
    const title = $('h5', header);
    title.addEventListener('blur', () => updateColumnName(column.id, title.textContent.trim()));
    title.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), title.blur()));
    $('[data-action="delete-column"]', header).addEventListener('click', () => deleteColumn(column.id));

    const body = make('div', 'card-body p-2 d-flex flex-column gap-2 overflow-y-auto column-tasks-scroll');
    body.dataset.columnId = column.id;
    body.addEventListener('dragover', e => (e.preventDefault(), body.classList.add('bg-body-secondary')));
    body.addEventListener('dragleave', () => body.classList.remove('bg-body-secondary'));
    body.addEventListener('drop', e => {
        e.preventDefault();
        body.classList.remove('bg-body-secondary');
        if (!draggedTaskId || !draggedFromColumnId) return;
        const after = getDragAfterElement(body, e.clientY);
        moveTask(draggedFromColumnId, column.id, draggedTaskId, after?.dataset.taskId || null);
    });
    body.append(...column.tasks.map(task => createTaskElement(task, column.id)));

    const footer = make('div', 'card-footer bg-transparent border-top-0 p-2 d-flex justify-content-center', `
    <button class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center gap-1 rounded-3 px-3 btn-dashed" data-action="add-task">
      <i class="bi bi-plus"></i> Añadir tarea
    </button>`);
    $('[data-action="add-task"]', footer).addEventListener('click', () => {
        location.href = `editortareas.html?id=${currentProjectId}&columnId=${encodeURIComponent(column.id)}`;
    });

    col.append(header, body, footer);
    return col;
}

function createTaskElement(task, columnId) {
    const card = make('div', 'card border shadow-sm task-card');
    card.dataset.taskId = task.id;
    card.draggable = true;
    card.addEventListener('dragstart', e => {
        draggedTaskId = task.id;
        draggedFromColumnId = columnId;
        card.classList.add('opacity-50');
        e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
        draggedTaskId = draggedFromColumnId = null;
        $$('.bg-body-secondary').forEach(el => el.classList.remove('bg-body-secondary'));
    });

    const body = make('div', 'card-body p-2');
    const row = make('div', 'd-flex align-items-start justify-content-between mb-1', `
    <span class="fw-medium small flex-grow-1">${task.title}</span>
    <div class="d-flex gap-1 ms-1">
      <button class="btn btn-sm p-0 border-0 text-secondary" title="Eliminar tarea" data-action="delete-task">
        <i class="bi bi-trash icon-xs"></i>
      </button>
    </div>`);
    $('[data-action="delete-task"]', row).addEventListener('click', e => (e.stopPropagation(), deleteTask(columnId, task.id)));
    body.appendChild(row);

    if (task.labels?.length) {
        const labels = make('div', 'd-flex flex-wrap gap-1 mb-1');
        task.labels.forEach(name => {
            const label = LABELS.find(item => item.name === name);
            if (label) labels.appendChild(make('span', `badge ${label.badgeClass} rounded-pill text-badge-sm`, name));
        });
        body.appendChild(labels);
    }

    if (task.dueDate) {
        const due = new Date(`${task.dueDate}T00:00:00`);
        const date = [due.getDate(), due.getMonth() + 1].map(n => String(n).padStart(2, '0')).join('/');
        body.appendChild(make('div', 'd-flex align-items-center gap-2 mt-1 text-badge-sm', `
      <span class="small fw-medium d-flex align-items-center gap-1 text-secondary"><i class="bi bi-calendar-event"></i> ${date}</span>
      <span class="ms-auto fw-medium text-badge-sm textColorProceso">${getRelativeDateText(task.dueDate).text}</span>`));
    }

    card.appendChild(body);
    return card;
}

/* ============================================================
   8. FUNCIONES — Columnas (CRUD)
   ============================================================ */
function addColumn(name, colorClass = COLORS[0]) {
    boardState.columns.push({ id: id(), name, colorClass, tasks: [] });
    saveToLocalStorage();
    renderBoard();
}

function deleteColumn(columnId) {
    const column = byId(boardState.columns, columnId);
    if (!column) return;
    const count = column.tasks.length;
    $('#deleteColumnModal')?.remove();

    const modalEl = make('div', 'modal fade', `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-3">
        <div class="modal-header navbarColor text-white">
          <h5 class="modal-title fw-semibold">Eliminar columna</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p class="mb-2 fw-medium">¿Eliminar la columna "${column.name}"?</p>
          <p class="mb-0 text-secondary">
            ${count ? `También se eliminarán sus ${count} tarea(s).` : 'Esta acción no se puede deshacer.'}
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn navbarColor text-white border-secondary" id="btn-confirm-delete-column">Eliminar columna</button>
        </div>
      </div>
    </div>`);
    modalEl.id = 'deleteColumnModal';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);

    const modal = new bootstrap.Modal(modalEl);
    const deleteBtn = $('#btn-confirm-delete-column', modalEl);
    const setDeleteHover = active => {
        deleteBtn.classList.toggle('text-white', !active);
        deleteBtn.classList.toggle('text-dark', active);
        deleteBtn.classList.toggle('bg-light', active);
    };

    deleteBtn.addEventListener('click', () => {
        removeColumn(columnId);
        modal.hide();
    });
    ['mouseenter', 'focus'].forEach(event => deleteBtn.addEventListener(event, () => setDeleteHover(true)));
    ['mouseleave', 'blur'].forEach(event => deleteBtn.addEventListener(event, () => setDeleteHover(false)));
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

function removeColumn(columnId) {
    boardState.columns = boardState.columns.filter(column => column.id !== columnId);
    saveToLocalStorage();
    renderBoard();
}

function updateColumnName(columnId, newName) {
    const column = byId(boardState.columns, columnId);
    if (column && newName) {
        column.name = newName;
        saveToLocalStorage();
    }
}

function promptAddColumn() {
    $('#addColumnModal')?.remove();
    const modalEl = make('div', 'modal fade', `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-3">
        <div class="modal-header navbarColor text-white">
          <h5 class="modal-title fw-semibold">Añadir columna</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="new-column-name" class="form-label fw-medium">Nombre de la columna</label>
            <input type="text" class="form-control" id="new-column-name" placeholder="Ej: Diseño">
            <div class="invalid-feedback">Ingresá un nombre para la columna.</div>
          </div>
          <p class="form-label fw-medium mb-2">Color de la columna</p>
          <div class="d-flex flex-wrap justify-content-center gap-4">
            ${COLORS.map((color, i) => `
              <input type="radio" class="btn-check" name="new-column-color" id="column-color-${i}" value="${color}" ${i ? '' : 'checked'}>
              <label class="color-swatch rounded-circle ${color} border border-${i ? 'secondary' : 'primary border-3 shadow'}" for="column-color-${i}" title="${color}" aria-label="${color}"></label>`).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn navbarColor text-white border-secondary" id="btn-save-column">Crear columna</button>
        </div>
      </div>
    </div>`);
    modalEl.id = 'addColumnModal';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);

    const modal = new bootstrap.Modal(modalEl);
    const input = $('#new-column-name', modalEl);
    const saveBtn = $('#btn-save-column', modalEl);
    const colorInputs = $$('input[name="new-column-color"]', modalEl);
    const paintColors = () => colorInputs.forEach(input => {
        const label = $(`label[for="${input.id}"]`, modalEl);
        ['border-primary', 'border-3', 'shadow'].forEach(cls => label.classList.toggle(cls, input.checked));
        label.classList.toggle('border-secondary', !input.checked);
    });
    const save = () => {
        const name = input.value.trim();
        if (!name) return input.classList.add('is-invalid'), input.focus();
        addColumn(name, $('input[name="new-column-color"]:checked', modalEl).value);
        modal.hide();
    };

    colorInputs.forEach(input => $(`label[for="${input.id}"]`, modalEl).addEventListener('click', () => (input.checked = true, paintColors())));
    const setSaveHover = active => {
        saveBtn.classList.toggle('text-white', !active);
        saveBtn.classList.toggle('text-dark', active);
        saveBtn.classList.toggle('bg-light', active);
    };
    saveBtn.addEventListener('click', save);
    ['mouseenter', 'focus'].forEach(event => saveBtn.addEventListener(event, () => setSaveHover(true)));
    ['mouseleave', 'blur'].forEach(event => saveBtn.addEventListener(event, () => setSaveHover(false)));
    input.addEventListener('input', () => input.classList.remove('is-invalid'));
    input.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), save()));
    modalEl.addEventListener('shown.bs.modal', () => input.focus());
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

/* ============================================================
   9. FUNCIONES — Tareas (CRUD)
   ============================================================ */
function showAddTaskForm(columnId, bodyElement) {
    if ($('.task-form-inline', bodyElement)) return;
    const form = make('div', 'card border-primary task-form-inline p-2', `
    <div class="mb-2"><input type="text" class="form-control form-control-sm" placeholder="Título de la tarea" id="new-task-title-${columnId}"></div>
    <div class="mb-2">
      <label class="form-label small mb-1 text-secondary">Etiquetas:</label>
      <div class="d-flex flex-wrap gap-1">${LABELS.map(label => `
        <div class="form-check form-check-inline m-0">
          <input class="form-check-input" type="checkbox" value="${label.name}" id="label-${columnId}-${label.name}">
          <label class="form-check-label small" for="label-${columnId}-${label.name}">${label.name}</label>
        </div>`).join('')}</div>
    </div>
    <div class="mb-2">
      <label class="form-label small mb-1 text-secondary"><i class="bi bi-calendar-event"></i> Fecha de entrega:</label>
      <input type="date" class="form-control form-control-sm" id="new-task-date-${columnId}">
    </div>
    <div class="d-flex gap-1">
      <button class="btn btn-sm btn-primary flex-grow-1" data-action="confirm-add">Añadir</button>
      <button class="btn btn-sm btn-outline-secondary" data-action="cancel-add">Cancelar</button>
    </div>`);
    const title = $(`#new-task-title-${columnId}`, form);
    $('[data-action="confirm-add"]', form).addEventListener('click', () => {
        const value = title.value.trim();
        if (!value) return title.classList.add('is-invalid');
        addTask(columnId, value, $$('input[type="checkbox"]:checked', form).map(cb => cb.value), $(`#new-task-date-${columnId}`, form).value || null);
    });
    $('[data-action="cancel-add"]', form).addEventListener('click', () => form.remove());
    title.addEventListener('keydown', e => e.key === 'Enter' && $('[data-action="confirm-add"]', form).click());
    bodyElement.appendChild(form);
    title.focus();
}

function addTask(columnId, title, labels = [], dueDate = null, description = '') {
    const column = byId(boardState.columns, columnId);
    if (!column) return;
    column.tasks.push({ id: id(), title, labels, dueDate, description });
    saveToLocalStorage();
    renderBoard();
}

function deleteTask(columnId, taskId) {
    const column = byId(boardState.columns, columnId);
    if (!column) return;
    column.tasks = column.tasks.filter(task => task.id !== taskId);
    saveToLocalStorage();
    renderBoard();
}

function showEditTaskModal(task, columnId) {
    $('#editTaskModal')?.remove();
    const modalEl = make('div', 'modal fade', `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar tarea</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label fw-medium">Título</label>
            <input type="text" class="form-control" id="edit-task-title" value="${task.title}">
          </div>
          <div class="mb-3">
            <label class="form-label fw-medium">Etiquetas</label>
            <div class="d-flex flex-wrap gap-2">${LABELS.map(label => `
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${label.name}" id="edit-label-${label.name}" ${task.labels?.includes(label.name) ? 'checked' : ''}>
                <label class="form-check-label" for="edit-label-${label.name}"><span class="badge ${label.badgeClass}">${label.name}</span></label>
              </div>`).join('')}</div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-medium"><i class="bi bi-calendar-event"></i> Fecha de entrega</label>
            <input type="date" class="form-control" id="edit-task-date" value="${task.dueDate || ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" id="btn-save-edit">Guardar</button>
        </div>
      </div>
    </div>`);
    modalEl.id = 'editTaskModal';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);

    const modal = new bootstrap.Modal(modalEl);
    $('#btn-save-edit', modalEl).addEventListener('click', () => {
        const title = $('#edit-task-title', modalEl);
        const value = title.value.trim();
        if (!value) return title.classList.add('is-invalid');
        updateTask(columnId, task.id, value, $$('input[type="checkbox"]:checked', modalEl).map(cb => cb.value), $('#edit-task-date', modalEl).value || null);
        modal.hide();
    });
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

function updateTask(columnId, taskId, title, labels, dueDate) {
    const task = byId(byId(boardState.columns, columnId)?.tasks || [], taskId);
    if (!task) return;
    Object.assign(task, { title, labels, dueDate });
    saveToLocalStorage();
    renderBoard();
}

/* ============================================================
   10. FUNCIONES — Drag & Drop
   ============================================================ */
function getDragAfterElement(container, y) {
    return $$('[data-task-id]:not(.opacity-50)', container).reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: -Infinity }).element;
}

function moveTask(fromColumnId, toColumnId, taskId, afterTaskId) {
    const from = byId(boardState.columns, fromColumnId);
    const to = byId(boardState.columns, toColumnId);
    const index = from?.tasks.findIndex(task => task.id === taskId) ?? -1;
    if (!from || !to || index < 0) return;
    const [task] = from.tasks.splice(index, 1);
    const afterIndex = afterTaskId ? to.tasks.findIndex(task => task.id === afterTaskId) : -1;
    to.tasks.splice(afterIndex < 0 ? to.tasks.length : afterIndex, 0, task);
    saveToLocalStorage();
    renderBoard();
}

/* ============================================================
   11. FUNCIONES — Edición inline (título/descripción)
   ============================================================ */
function setupInlineEdit(pencilId, textId) {
    const pencil = document.getElementById(pencilId);
    const text = document.getElementById(textId);
    if (!pencil || !text) return;
    pencil.addEventListener('click', () => {
        text.contentEditable = true;
        text.classList.add('editable-title');
        text.focus();
        const range = document.createRange();
        range.selectNodeContents(text);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
    });
    text.addEventListener('blur', () => {
        text.removeAttribute('contenteditable');
        text.classList.remove('editable-title');
        if (textId === 'project-title') updateNavbarProjectTitle();
    });
    text.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), text.blur()));
    if (textId === 'project-title') text.addEventListener('input', updateNavbarProjectTitle);
}

function updateNavbarProjectTitle() {
    const title = DOM.projectTitle;
    const navbar = DOM.navbarProjectTitle;
    if (title) {
        const text = title.textContent.trim() || 'Titulo del proyecto 1';
        if (navbar) navbar.textContent = text;
        boardState.projectTitle = text;
        saveToLocalStorage();
    }
}

/* ============================================================
   12. EVENTOS E INICIALIZACIÓN
   ============================================================ */
function initEditableFields() {
    setupInlineEdit('edit-project-title', 'project-title');
    setupInlineEdit('edit-project-desc', 'project-description');
    updateNavbarProjectTitle();
}

function initSearchListeners() {
    // 1. Filtrado en la Home
    if (DOM.searchProjectsInput) {
        DOM.searchProjectsInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            DOM.clearProjectsBtn.style.display = query.length > 0 ? 'block' : 'none';

            $$('.card, .project-card').forEach(card => {
                if (card.classList.contains('column-width')) return;
                const title = card.querySelector('h3, h4, p.card-title')?.textContent.toLowerCase() || '';
                card.style.display = title.includes(query) ? '' : 'none';
            });
        });

        DOM.clearProjectsBtn.addEventListener('click', () => {
            DOM.searchProjectsInput.value = '';
            DOM.clearProjectsBtn.style.display = 'none';
            DOM.searchProjectsInput.dispatchEvent(new Event('input'));
            DOM.searchProjectsInput.focus();
        });
    }

    // 2. Filtrado en el Board
    if (DOM.searchTasksInput) {
        DOM.searchTasksInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            DOM.clearTasksBtn.style.display = query.length > 0 ? 'block' : 'none';

           $$('.task-card').forEach(card => {
    const title = card.querySelector('.fw-medium.small')?.textContent.toLowerCase() || '';

    if (query === '') {
        card.style.outline = '';
        card.style.boxShadow = '';
        return;
    }

    if (title.includes(query)) {
        card.style.outline = '2px solid #0d6efd';
        card.style.boxShadow = '0 0 10px rgba(13,110,253,.35)';
    } else {
        card.style.outline = '';
        card.style.boxShadow = '';
    }
        });
        });

        DOM.clearTasksBtn.addEventListener('click', () => {
            DOM.searchTasksInput.value = '';
            DOM.clearTasksBtn.style.display = 'none';
            DOM.searchTasksInput.dispatchEvent(new Event('input'));
            DOM.searchTasksInput.focus();
        });
    }
}

function renderEditorTasks() {
    if (!DOM.listaTareas) return;
    DOM.listaTareas.innerHTML = '';
    const allTasks = boardState.columns.flatMap(c => c.tasks.map(t => ({...t, colName: c.name, colColor: c.colorClass, colId: c.id})));
    
    if (allTasks.length === 0) {
        DOM.listaTareas.innerHTML = `
            <div class="text-center my-5 text-muted">
                <p class="fs-4 mb-1">📋</p>
                <p class="small fw-medium">No hay tareas cargadas todavía.</p>
            </div>
        `;
        return;
    }

    allTasks.forEach(task => {
        const tarjeta = make('div', 'p-3 bg-body-secondary border rounded-3 shadow-sm d-flex flex-column gap-1 animate-fade-in mb-3');
        
        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong class="text-dark d-block">${task.title}</strong>
                    ${task.labels && task.labels.length ? `<span class="badge bg-secondary text-capitalize mt-1" style="font-size: 10px;">${task.labels[0]}</span>` : ''}
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary border-0 p-1 btn-editar" data-col="${task.colId}" data-id="${task.id}" title="Editar">✏️</button>
                    <button class="btn btn-sm btn-outline-danger border-0 p-1 btn-eliminar" data-col="${task.colId}" data-id="${task.id}" title="Eliminar">❌</button>
                </div>
            </div>
            ${task.description ? `<p class="text-muted small my-2">${task.description}</p>` : ''}
            <div class="d-flex justify-content-between align-items-center mt-2" style="font-size: 12px;">
                <span class="text-primary fw-semibold">${task.colName}</span>
                ${task.dueDate ? `<span class="text-muted">📅 ${task.dueDate.split('-').reverse().join('/')}</span>` : ''}
            </div>
        `;
        DOM.listaTareas.appendChild(tarjeta);
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', e => {
            const taskId = e.target.closest('button').dataset.id;
            const colId = e.target.closest('button').dataset.col;
            if (confirm('¿Estás seguro de que querés eliminar esta tarea?')) {
                deleteTask(colId, taskId);
                renderEditorTasks();
            }
        });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', e => {
            const taskId = e.target.closest('button').dataset.id;
            const colId = e.target.closest('button').dataset.col;
            const column = byId(boardState.columns, colId);
            const taskToEdit = column?.tasks.find(t => t.id === taskId);
            
            if (taskToEdit) {
                DOM.tituloTarea.value = taskToEdit.title;
                const descInput = $('#desc-tarea');
                if (descInput) descInput.value = taskToEdit.description || '';
                if (DOM.fechaTarea) DOM.fechaTarea.value = taskToEdit.dueDate || '';
                
                const mapPiezaReverse = { 'Logo': 'logo', 'Banner': 'banner', 'Redes': 'redes', 'UI': 'ui' };
                if (DOM.tipoPieza && taskToEdit.labels && taskToEdit.labels.length) {
                    DOM.tipoPieza.value = mapPiezaReverse[taskToEdit.labels[0]] || '';
                    checkPlaceholder(DOM.tipoPieza);
                }
                
                const mapEstadoReverse = { 'Brief': 'brief', 'En proceso': 'proceso', 'Revisión del cliente': 'revision', 'Aprobado': 'aprobado' };
                if (DOM.estadoTarea) {
                    DOM.estadoTarea.value = mapEstadoReverse[column.name] || '';
                    checkPlaceholder(DOM.estadoTarea);
                }
                
                DOM.formTarea.dataset.editandoId = taskToEdit.id;
                DOM.formTarea.dataset.editandoCol = colId;
                const btnCrear = document.querySelector('.btn-crear');
                if (btnCrear) btnCrear.textContent = 'Guardar cambios';
                DOM.tituloTarea.focus();
            }
        });
    });
}

function initEditor() {
    if (!DOM.formTarea) return;

    const params = new URLSearchParams(window.location.search);
    const urlColumnId = params.get('columnId');
    if (urlColumnId && DOM.estadoTarea) {
        const column = byId(boardState.columns, urlColumnId);
        if (column) {
            const valMap = { 'Brief': 'brief', 'En proceso': 'proceso', 'Revisión del cliente': 'revision', 'Aprobado': 'aprobado' };
            DOM.estadoTarea.value = valMap[column.name] || '';
            checkPlaceholder(DOM.estadoTarea);
        }
    }

    DOM.formTarea.addEventListener('submit', e => {
        e.preventDefault();
        const title = DOM.tituloTarea.value.trim();
        const dueDate = DOM.fechaTarea ? DOM.fechaTarea.value : null;
        const descInput = $('#desc-tarea');
        const description = descInput ? descInput.value.trim() : '';
        
        const mapPieza = { 'logo': 'Logo', 'banner': 'Banner', 'redes': 'Redes', 'ui': 'UI' };
        const labels = [];
        if (DOM.tipoPieza && DOM.tipoPieza.value && mapPieza[DOM.tipoPieza.value]) {
            labels.push(mapPieza[DOM.tipoPieza.value]);
        }

        let targetColumn = boardState.columns[0];
        if (DOM.estadoTarea && DOM.estadoTarea.value) {
            const mapEstado = { 'brief': 'Brief', 'proceso': 'En proceso', 'revision': 'Revisión del cliente', 'aprobado': 'Aprobado' };
            const colName = mapEstado[DOM.estadoTarea.value];
            if (colName) targetColumn = boardState.columns.find(c => c.name === colName) || targetColumn;
        }

        if (title && targetColumn) {
            const editId = DOM.formTarea.dataset.editandoId;
            const editCol = DOM.formTarea.dataset.editandoCol;
            
            if (editId && editCol) {
                if (editCol !== targetColumn.id) {
                    deleteTask(editCol, editId);
                    addTask(targetColumn.id, title, labels, dueDate, description);
                } else {
                    const taskToEdit = byId(byId(boardState.columns, editCol)?.tasks || [], editId);
                    if (taskToEdit) {
                        taskToEdit.title = title;
                        taskToEdit.labels = labels;
                        taskToEdit.dueDate = dueDate;
                        taskToEdit.description = description;
                        saveToLocalStorage();
                        renderBoard();
                    }
                }
                delete DOM.formTarea.dataset.editandoId;
                delete DOM.formTarea.dataset.editandoCol;
                const btnCrear = document.querySelector('.btn-crear');
                if (btnCrear) btnCrear.textContent = 'Crear tarea';
            } else {
                addTask(targetColumn.id, title, labels, dueDate, description);
            }

            DOM.formTarea.reset();
            if (DOM.tipoPieza) checkPlaceholder(DOM.tipoPieza);
            if (DOM.estadoTarea) checkPlaceholder(DOM.estadoTarea);
            renderEditorTasks();
        }
    });

    const formCancelBtn = document.querySelector('#form-tarea .btn-cancelar');
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', () => {
            DOM.formTarea.reset();
            delete DOM.formTarea.dataset.editandoId;
            delete DOM.formTarea.dataset.editandoCol;
            const btnCrear = document.querySelector('.btn-crear');
            if (btnCrear) btnCrear.textContent = 'Crear tarea';
            if (DOM.tipoPieza) checkPlaceholder(DOM.tipoPieza);
            if (DOM.estadoTarea) checkPlaceholder(DOM.estadoTarea);
        });
    }

    const btnVolver = document.querySelector('a.btn-cancelar[href="board.html"]');
    if (btnVolver && currentProjectId) {
        btnVolver.href = `board.html?id=${currentProjectId}`;
    }

    renderEditorTasks();
}

// MODIFICADO: Renderiza las tarjetas de proyectos en la Home utilizando la nueva estructura de datos, soportando imágenes de portada o color seleccionado, eliminación de proyectos y enlazando la creación de proyectos
function renderHomeProjectsList() {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;
    
    let projects = getNormalizedProjects();
    projects.sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0)); // más recientes primero
    
    const btnNewProjectHTML = `
        <a class="project-card-new d-flex flex-column align-items-center justify-content-center gap-3 py-4 text-decoration-none"
            href="home.html?new=1" id="card-new-project">
            <div class="new-project-icon rounded-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-plus"></i>
            </div>
            <span class="small fw-semibold text-primary-brand">Nuevo proyecto</span>
        </a>
    `;
    
    projectsContainer.innerHTML = '';
    const pastelColors = ['#7F9C96', '#b5c68a', '#e3c27f', '#d8a7a7', '#9fb8d0', '#bca3cc'];
    
    projects.forEach((proj, index) => {
        let title = proj.titulo || 'Sin título';
        let tasks = proj.columnas ? proj.columnas.flatMap(c => c.tasks) : [];
        let total = tasks.length;
        let color = pastelColors[index % pastelColors.length];
        
        let coverStyle = '';
        let coverClassExtra = '';
        
        if (proj.imagen) {
            coverStyle = `background-image: url('${proj.imagen}'); background-size: cover; background-position: center;`;
        } else if (proj.color) {
            if (proj.color.startsWith('#')) {
                coverStyle = `background-color: ${proj.color};`;
            } else {
                coverClassExtra = proj.color; // Clase del CSS (ej: bg-brief-pastel)
            }
        } else {
            coverStyle = `background-color: ${color};`;
        }
        
        projectsContainer.innerHTML += `
            <div class="project-card card border-0 overflow-hidden position-relative">
                <button class="btn btn-sm btn-light position-absolute end-0 top-0 m-2 rounded-circle shadow-sm btn-delete-project border-0"
                    data-project-id="${proj.id}" data-project-title="${title.replace(/"/g, '&quot;')}" title="Eliminar proyecto" style="z-index: 10; opacity: 0.9; width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">
                    <i class="bi bi-trash text-danger" style="font-size: 0.85rem;"></i>
                </button>
                <a href="board.html?id=${proj.id}" class="text-decoration-none text-reset">
                    <div class="project-card-cover ${coverClassExtra}" style="${coverStyle}"></div>
                    <div class="card-body p-3">
                        <p class="card-title small fw-semibold text-truncate mb-2">${title}</p>
                        <div class="d-flex align-items-center flex-wrap gap-2">
                            <span class="small text-secondary">Tareas</span>
                            <span class="small text-muted d-flex align-items-center gap-1"><span
                                class="stat-dot rounded-circle d-inline-block bg-success"></span> ${total}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    });
    
    projectsContainer.innerHTML += btnNewProjectHTML;

    // Registra eventos para la eliminación de tableros
    document.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const projId = btn.dataset.projectId;
            const projTitle = btn.dataset.projectTitle;
            if (confirm(`¿Estás seguro de que querés eliminar el proyecto "${projTitle}"? Esta acción no se puede deshacer.`)) {
                let projects = getNormalizedProjects();
                projects = projects.filter(p => p.id !== projId);
                localStorage.setItem(getProjectsStorageKey(), JSON.stringify(projects));
                renderHomeProjectsList();
            }
        });
    });
}

// NUEVA: Despliega un modal interactivo de creación de proyecto pidiendo nombre, URL de imagen o color de portada (de los definidos en CSS)
function promptCreateProject() {
    $('#createProjectModal')?.remove();
    const modalEl = make('div', 'modal fade', `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-3">
        <div class="modal-header navbarColor text-white">
          <h5 class="modal-title fw-semibold">Crear Proyecto</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="new-project-title" class="form-label fw-medium">Nombre del proyecto</label>
            <input type="text" class="form-control" id="new-project-title" placeholder="Ej: Rebranding Café Aurora">
            <div class="invalid-feedback">Ingresá un nombre para el proyecto.</div>
          </div>
          <div class="mb-3">
            <label for="new-project-image" class="form-label fw-medium">URL de la imagen del proyecto</label>
            <input type="url" class="form-control" id="new-project-image" placeholder="Ej: https://images.unsplash.com/...">
            <div class="form-text text-muted small">Colocá el enlace de la imagen o dejalo vacío para usar el color seleccionado abajo.</div>
          </div>
          <p class="form-label fw-medium mb-2">Color de portada (si no ingresás una URL de imagen)</p>
          <div class="d-flex flex-wrap justify-content-center gap-4 mb-3">
            ${COLORS.map((color, i) => `
              <input type="radio" class="btn-check" name="new-project-color" id="project-color-${i}" value="${color}" ${i ? '' : 'checked'}>
              <label class="color-swatch rounded-circle ${color} border border-${i ? 'secondary' : 'primary border-3 shadow'}" for="project-color-${i}" title="${color}" aria-label="${color}"></label>`).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn navbarColor text-white border-secondary" id="btn-save-project">Crear proyecto</button>
        </div>
      </div>
    </div>`);
    modalEl.id = 'createProjectModal';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);

    const modal = new bootstrap.Modal(modalEl);
    const inputTitle = $('#new-project-title', modalEl);
    const inputImage = $('#new-project-image', modalEl);
    const saveBtn = $('#btn-save-project', modalEl);
    const colorInputs = $$('input[name="new-project-color"]', modalEl);

    // Dibuja los bordes de selección de forma idéntica al modal de columnas
    const paintColors = () => colorInputs.forEach(input => {
        const label = $(`label[for="${input.id}"]`, modalEl);
        ['border-primary', 'border-3', 'shadow'].forEach(cls => label.classList.toggle(cls, input.checked));
        label.classList.toggle('border-secondary', !input.checked);
    });

    colorInputs.forEach(input => $(`label[for="${input.id}"]`, modalEl).addEventListener('click', () => (input.checked = true, paintColors())));

    const save = () => {
        const title = inputTitle.value.trim();
        if (!title) {
            inputTitle.classList.add('is-invalid');
            inputTitle.focus();
            return;
        }
        
        const imageUrl = inputImage.value.trim();
        const selectedColorInput = $('input[name="new-project-color"]:checked', modalEl);
        const selectedColor = selectedColorInput ? selectedColorInput.value : COLORS[0];
        const newProjId = id();
        
        let projects = getNormalizedProjects();
        const newProject = {
            id: newProjId,
            titulo: title,
            imagen: imageUrl,
            color: selectedColor,
            columnas: DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] })),
            lastModified: Date.now()
        };
        projects.push(newProject);
        localStorage.setItem(getProjectsStorageKey(), JSON.stringify(projects));
        
        modal.hide();
        window.location.href = `board.html?id=${newProjId}`;
    };

    saveBtn.addEventListener('click', save);
    inputTitle.addEventListener('input', () => inputTitle.classList.remove('is-invalid'));
    inputTitle.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), save()));
    inputImage.addEventListener('keydown', e => e.key === 'Enter' && (e.preventDefault(), save()));
    
    modalEl.addEventListener('shown.bs.modal', () => inputTitle.focus());
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

// MODIFICADO: Inicialización de la app, adaptada para controlar la intercepción de URL params para creación y listeners sin recarga en la Home
function initBoard() {
    cacheDOMSelectors();
    initSession();

    const isHome = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('PRUEBA3');

    if (!loadFromLocalStorage()) {
        if (!isHome) {
            currentProjectId = id();
            boardState.columns = DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] }));
            boardState.projectTitle = 'Titulo del proyecto 1';
            saveToLocalStorage();
            window.history.replaceState({}, '', window.location.pathname + '?id=' + currentProjectId);
        }
    }

    if (!isHome) {
        if (DOM.projectTitle) DOM.projectTitle.textContent = boardState.projectTitle;
        if (DOM.editorNavTitle) DOM.editorNavTitle.textContent = boardState.projectTitle;
        if (DOM.editorMainTitle) DOM.editorMainTitle.textContent = boardState.projectTitle;
        updateNavbarProjectTitle();

        renderBoard();
        initEditableFields();
        initSearchListeners();
        initEditor();
    } else {
        initSearchListeners();
        renderHomeProjectsList();

        // Si se redireccionó a la Home pidiendo un nuevo proyecto (?new=1), se limpia la URL param y se levanta el modal
        const params = new URLSearchParams(window.location.search);
        if (params.get('new') === '1') {
            window.history.replaceState({}, '', window.location.pathname);
            promptCreateProject();
        }

        // Listener para interceptar clics en triggers de creación de proyectos y levantar el modal sin recargar página si se está en la Home
        document.addEventListener('click', e => {
            const trigger = e.target.closest('#sidebar-new-project, #card-new-project');
            if (trigger) {
                e.preventDefault();
                promptCreateProject();
            }
        });
    }
}

initBoard();
