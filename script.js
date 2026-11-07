let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [
    { id: '1', title: 'Definir requisitos do sistema', description: 'Mapear telas e regras exigidas pelo professor.', priority: 'alta', dueDate: '2026-11-01', status: 'todo' },
    { id: '2', title: 'Construir interface HTML e CSS', description: 'Desenvolver layout responsivo com menu e Kanban.', priority: 'media', dueDate: '2026-11-12', status: 'doing' },
    { id: '3', title: 'Criar estrutura de pastas', description: 'Configurar repositório e arquivos base no VS Code.', priority: 'baixa', dueDate: '2026-11-08', status: 'done' }
];

let activeSidebarFilter = 'all';

// Elementos do DOM
const taskForm = document.getElementById('task-form');
const modalTask = document.getElementById('modal-task');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const searchInput = document.getElementById('search-input');
const filterPriority = document.getElementById('filter-priority');
const filterStatus = document.getElementById('filter-status');
const btnClearFilters = document.getElementById('btn-clear-filters');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

function saveToLocalStorage() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// Abrir e Fechar Modal
btnOpenModal.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Cadastrar Nova Tarefa';
    taskForm.reset();
    document.getElementById('task-id').value = '';
    modalTask.classList.remove('hidden');
});

function closeModal() {
    modalTask.classList.add('hidden');
}

btnCloseModal.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);

// Menu lateral interativo
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        activeSidebarFilter = item.getAttribute('data-filter');
        renderTasks();
    });
});

// Envio do formulário (Criar ou Editar)
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-date').value;

    if (id) {
        tasks = tasks.map(task => task.id === id ? { ...task, title, description, priority, dueDate } : task);
    } else {
        tasks.push({ id: Date.now().toString(), title, description, priority, dueDate, status: 'todo' });
    }

    saveToLocalStorage();
    closeModal();
    renderTasks();
});

// Função auxiliar para verificar se uma tarefa está atrasada
function isTaskOverdue(dueDate, status) {
    if (!dueDate || status === 'done') return false;
    
    // Obter data atual no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
}

// Renderização e Filtros
function renderTasks() {
    const listTodo = document.getElementById('list-todo');
    const listDoing = document.getElementById('list-doing');
    const listDone = document.getElementById('list-done');

    listTodo.innerHTML = '';
    listDoing.innerHTML = '';
    listDone.innerHTML = '';

    const searchTerm = searchInput.value.toLowerCase();
    const priorityFilter = filterPriority.value;
    const statusFilter = filterStatus.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
        
        let matchesStatus = statusFilter === '' || task.status === statusFilter;
        if (activeSidebarFilter !== 'all') {
            matchesStatus = matchesStatus && (task.status === activeSidebarFilter);
        }

        return matchesSearch && matchesPriority && matchesStatus;
    });

    let countTodo = 0, countDoing = 0, countDone = 0;

    filteredTasks.forEach(task => {
        if (task.status === 'todo') countTodo++;
        if (task.status === 'doing') countDoing++;
        if (task.status === 'done') countDone++;

        const overdue = isTaskOverdue(task.dueDate, task.status);

        const card = document.createElement('div');
        card.className = `task-card ${overdue ? 'task-overdue' : ''}`;
        card.innerHTML = `
            <div class="task-card-header">
                <span class="badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                ${overdue ? '<span class="badge-overdue">⚠️ ATRASADA</span>' : ''}
            </div>
            <h3>${task.title}</h3>
            <p>${task.description || 'Sem descrição.'}</p>
            <div class="task-card-footer">
                <span class="due-date ${overdue ? 'text-overdue' : ''}">
                    Prazo: ${task.dueDate ? task.dueDate.split('-').reverse().join('/') : 'Não definido'}
                </span>
                <div class="card-actions" style="display: flex; align-items: center; gap: 6px;">
                    <select onchange="changeStatus('${task.id}', this.value)" style="font-size:11px; padding:2px; font-family: monospace;">
                        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>A Fazer</option>
                        <option value="doing" ${task.status === 'doing' ? 'selected' : ''}>Em Andamento</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>Concluída</option>
                    </select>
                    <button onclick="editTask('${task.id}')" title="Editar" style="background:none; border:none; cursor:pointer; font-size:14px; padding:2px;">✏️</button>
                    <button onclick="deleteTask('${task.id}')" title="Excluir" style="background:none; border:none; cursor:pointer; font-size:14px; padding:2px;">🗑️</button>
                </div>
            </div>
        `;

        if (task.status === 'todo') listTodo.appendChild(card);
        if (task.status === 'doing') listDoing.appendChild(card);
        if (task.status === 'done') listDone.appendChild(card);
    });

    // Atualizar contadores do Dashboard
    document.getElementById('stat-total').textContent = tasks.length;
    document.getElementById('stat-todo').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('stat-doing').textContent = tasks.filter(t => t.status === 'doing').length;
    document.getElementById('stat-done').textContent = tasks.filter(t => t.status === 'done').length;

    // Badges das colunas
    document.getElementById('count-todo').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('count-doing').textContent = tasks.filter(t => t.status === 'doing').length;
    document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

function changeStatus(id, newStatus) {
    tasks = tasks.map(task => task.id === id ? { ...task, status: newStatus } : task);
    saveToLocalStorage();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('modal-title').textContent = 'Editar Tarefa';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-date').value = task.dueDate;
    modalTask.classList.remove('hidden');
}

function deleteTask(id) {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
    }
}

searchInput.addEventListener('input', renderTasks);
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);

btnClearFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterPriority.value = '';
    filterStatus.value = '';
    activeSidebarFilter = 'all';
    navItems.forEach((nav, idx) => {
        if (idx === 0) nav.classList.add('active');
        else nav.classList.remove('active');
    });
    renderTasks();
});

renderTasks();