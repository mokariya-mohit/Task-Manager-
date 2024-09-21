const socket = io('http://localhost:3000');  // Replace with your server URL

let currentPage = 1;  // Track the current page
let filters = {};  // Store filters for the current query

// Function to render tasks in the UI
function renderTasks(tasks) {
    const taskList = document.getElementById('tasks');
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.innerHTML = `
            <div class="task-item">
                <span><strong>Title:</strong> ${task.title}</span>
                <span><strong>Category:</strong> ${task.category}</span>
                <span><strong>Status:</strong> ${task.status}</span>
                <span><strong>Priority:</strong> ${task.priority}</span>
                <span><strong>Due Date:</strong> ${task.dueDate}</span>
            </div>
            <div class="actions">
                <button class="edit" onclick="showEditForm('${task._id}', '${task.title}', '${task.category}', '${task.priority}', '${task.dueDate}')">Edit</button>
                <button class="delete" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
}

// Fetch and render tasks with filters and pagination
async function fetchTasks(page = 1, filters = {}) {
    const query = new URLSearchParams({ page, ...filters }).toString();  // Convert filters and pagination to query params
    try {
        const response = await fetch(`/api/tasks?${query}`);
        if (response.ok) {
            const { tasks, totalPages, currentPage } = await response.json();
            renderTasks(tasks);
            renderPagination(totalPages, currentPage);
        } else {
            throw new Error('Failed to fetch tasks');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Function to render pagination controls
function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.onclick = () => fetchTasks(i, filters);
        if (i === currentPage) pageButton.disabled = true;
        pagination.appendChild(pageButton);
    }
}

// Add a new task
document.getElementById('addTaskForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (title && category) {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, category, priority, dueDate })
            });
            if (response.ok) {
                const task = await response.json();
                socket.emit('taskAdded', task);  // Notify other clients
                fetchTasks(currentPage, filters);  // Refresh tasks
                document.getElementById('addTaskForm').reset();
            } else {
                throw new Error('Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
});

// Edit a task
async function showEditForm(id, title, category, priority, dueDate) {
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTaskTitle').value = title;
    document.getElementById('editTaskCategory').value = category;
    document.getElementById('editTaskPriority').value = priority;
    document.getElementById('editTaskDueDate').value = dueDate;
    document.getElementById('editTaskForm').style.display = 'block';
}

// Handle task updates
document.getElementById('editTaskForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value;
    const category = document.getElementById('editTaskCategory').value;
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate = document.getElementById('editTaskDueDate').value;

    if (title && category) {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, category, priority, dueDate })
            });
            if (response.ok) {
                const updatedTask = await response.json();
                socket.emit('taskUpdated', updatedTask);  // Notify other clients
                fetchTasks(currentPage, filters);  // Refresh tasks
                document.getElementById('editTaskForm').style.display = 'none';
            } else {
                throw new Error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }
});

// Delete a task
async function deleteTask(id) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            const deletedTask = await response.json();
            socket.emit('taskDeleted', deletedTask);  // Notify other clients
            fetchTasks(currentPage, filters);  // Refresh tasks
        } else {
            throw new Error('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Handle real-time updates from Socket.io
socket.on('taskAdded', (task) => {
    fetchTasks(currentPage, filters);
});
socket.on('taskUpdated', (task) => {
    fetchTasks(currentPage, filters);
});
socket.on('taskDeleted', (task) => {
    fetchTasks(currentPage, filters);
});

// Add event listener for filters
document.getElementById('filterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    filters = {
        status: document.getElementById('filterStatus').value,
        category: document.getElementById('filterCategory').value,
        priority: document.getElementById('filterPriority').value,
        dueDate: document.getElementById('filterDueDate').value
    };
    fetchTasks(currentPage, filters);
});

// Pagination controls
document.getElementById('pagination').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        currentPage = parseInt(event.target.innerText);
        fetchTasks(currentPage, filters);
    }
});

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (email && password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const { token } = await response.json();
                localStorage.setItem('authToken', token);  // Store token in localStorage
                showSection('taskSection');  // Show the task section
            } else {
                throw new Error('Failed to login');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (name && email && password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            if (response.ok) {
                showSection('loginSection');  // Show the login section after registration
            } else {
                throw new Error('Failed to register');
            }
        } catch (error) {
            console.error('Error registering:', error);
        }
    }
});

// Initialize by showing the tasks section
showSection('taskSection');
