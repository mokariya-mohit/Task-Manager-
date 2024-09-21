let token = ''; // Store JWT token here

// Function to set the token, typically after login
function setToken(newToken) {
    token = newToken;
}

// Function to render tasks in the UI
function renderTasks(tasks) {
    // ... existing code
}

// Fetch and render tasks with filters and pagination
async function fetchTasks(page = 1, filters = {}) {
    const query = new URLSearchParams({ page, ...filters }).toString();  // Convert filters and pagination to query params
    try {
        const response = await fetch(`/api/tasks?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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

// Add a new task
document.getElementById('addTaskForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    if (title && category) {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, category })
            });
            if (response.ok) {
                const task = await response.json();
                fetchTasks();  // Refresh the task list
                socket.emit('taskUpdated', task);  // Notify other clients
            } else {
                throw new Error('Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
});

// Show edit form
function showEditForm(id, title, category) {
    // ... existing code
}

// Delete a task
async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }); // Include token in the request
            fetchTasks();  // Refresh the task list
            socket.emit('taskUpdated', { _id: id });  // Notify other clients
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
}

// Apply filters and fetch tasks
document.getElementById('filterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const dueDate = document.getElementById('dueDateFilter').value;

    filters = { status, priority, dueDate };
    fetchTasks(1, filters);  // Fetch filtered tasks from page 1
});

// Example: Set the token (you would get this from your login process)
setToken('your-jwt-token-here');

// Initial fetch of tasks
fetchTasks(currentPage, filters);

// Listen for real-time task updates
socket.on('updateTasks', () => {
    fetchTasks(currentPage, filters);  // Refresh task list to include updates
});
