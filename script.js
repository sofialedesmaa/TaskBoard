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
const saveToLocalStorage = () => {
    if (!currentProjectId) return;
    let projects = JSON.parse(localStorage.getItem('katban_projects')) || [];
    let idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
        projects[idx].state = boardState;
        projects[idx].lastModified = Date.now();
    } else {
        projects.push({ id: currentProjectId, state: boardState, lastModified: Date.now() });
    }
    localStorage.setItem('katban_projects', JSON.stringify(projects));
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
function migrateOldData() {
    let oldState = localStorage.getItem('taskboard_state');
    let projects = JSON.parse(localStorage.getItem('katban_projects')) || [];
    if (oldState) {
        try {
            let parsedOld = JSON.parse(oldState);
            projects.push({ id: id(), state: parsedOld, lastModified: Date.now() });
            localStorage.removeItem('taskboard_state');
            localStorage.setItem('katban_projects', JSON.stringify(projects));
        } catch (e) {}
    }
}

function loadFromLocalStorage() {
    migrateOldData();
    let projects = JSON.parse(localStorage.getItem('katban_projects')) || [];
    
    // Si no hay ningún proyecto, precargar los que el usuario espera ver
    if (projects.length === 0) {
        projects.push({
            id: id(),
            state: {
                columns: DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] })),
                projectTitle: 'Título del proyecto 1'
            },
            lastModified: Date.now() + 1000 // Para que aparezca primero
        });
        projects.push({
            id: id(),
            state: {
                columns: DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] })),
                projectTitle: 'Título del proyecto 2'
            },
            lastModified: Date.now()
        });
        localStorage.setItem('katban_projects', JSON.stringify(projects));
    }

    const params = new URLSearchParams(window.location.search);
    const isHome = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('PRUEBA3');
    
    if (isHome) return true;

    if (params.get('new') === '1') {
        const newProjId = id();
        const newState = {
            columns: DEFAULT_COLUMNS.map(([name, colorClass]) => ({ id: id(), name, colorClass, tasks: [] })),
            projectTitle: 'Titulo del proyecto 1'
        };
        projects.push({ id: newProjId, state: newState, lastModified: Date.now() });
        localStorage.setItem('katban_projects', JSON.stringify(projects));
        
        window.history.replaceState({}, '', window.location.pathname + '?id=' + newProjId);
        currentProjectId = newProjId;
        boardState = newState;
        return true;
    }

    let reqId = params.get('id');
    if (reqId) {
        let proj = projects.find(p => p.id === reqId);
        if (proj) {
            currentProjectId = proj.id;
            boardState = proj.state;
            if (!boardState.projectTitle) boardState.projectTitle = 'Titulo del proyecto 1';
            normalizeDefaultColumnNames();
            return true;
        }
    }
    
    if (projects.length > 0) {
        projects.sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0));
        currentProjectId = projects[0].id;
        boardState = projects[0].state;
        window.history.replaceState({}, '', window.location.pathname + '?id=' + currentProjectId);
        if (!boardState.projectTitle) boardState.projectTitle = 'Titulo del proyecto 1';
        normalizeDefaultColumnNames();
        return true;
    }

    return false;
}

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

function renderHomeProjectsList() {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;
    
    let projects = JSON.parse(localStorage.getItem('katban_projects')) || [];
    projects.sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0)); // más recientes primero
    
    const btnNewProjectHTML = `
        <a class="project-card-new d-flex flex-column align-items-center justify-content-center gap-3 py-4 text-decoration-none"
            href="board.html?new=1">
            <div class="new-project-icon rounded-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-plus"></i>
            </div>
            <span class="small fw-semibold text-primary-brand">Nuevo proyecto</span>
        </a>
    `;
    
    projectsContainer.innerHTML = '';
    const pastelColors = ['#7F9C96', '#b5c68a', '#e3c27f', '#d8a7a7', '#9fb8d0', '#bca3cc'];
    
    projects.forEach((proj, index) => {
        let title = proj.state.projectTitle || 'Sin título';
        let tasks = proj.state.columns ? proj.state.columns.flatMap(c => c.tasks) : [];
        let total = tasks.length;
        let color = pastelColors[index % pastelColors.length];
        
        projectsContainer.innerHTML += `
            <a href="board.html?id=${proj.id}" class="project-card card border-0 overflow-hidden text-decoration-none text-reset">
                <div class="project-card-cover" style="background-color: ${color};"></div>
                <div class="card-body p-3">
                    <p class="card-title small fw-semibold text-truncate mb-2">${title}</p>
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <span class="small text-secondary">Tareas</span>
                        <span class="small text-muted d-flex align-items-center gap-1"><span
                            class="stat-dot rounded-circle d-inline-block bg-success"></span> ${total}</span>
                    </div>
                </div>
            </a>
        `;
    });
    
    projectsContainer.innerHTML += btnNewProjectHTML;
}

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
    }
}

initBoard();
