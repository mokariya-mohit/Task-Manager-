const Task = require('../models/Task');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, assignedUser } = req.body;

        // Validate input
        if (!title || !description || !dueDate || !priority || !assignedUser) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create new task with authenticated user as the owner
        const newTask = new Task({
            title,
            description,
            dueDate,
            priority,
            assignedUser,
            user: req.user._id // Set the user field to the authenticated user's ID
        });

        await newTask.save();

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all tasks for the authenticated user
exports.getUserTasks = async (req, res) => {
    const { status, priority, dueDate, assignee, sortBy = 'dueDate', page = 1, limit = 10 } = req.query;

    try {
        const query = { userId: req.user.id };

        if (status) query.completed = status === 'Completed';
        if (priority) query.priority = priority;
        if (dueDate) query.dueDate = new Date(dueDate);
        if (assignee) query.assignedUser = assignee;

        const sort = {};
        sort[sortBy] = 1;

        const tasks = await Task.find(query).sort(sort).skip((page - 1) * limit).limit(parseInt(limit));

        const totalTasks = await Task.countDocuments(query);

        res.json({
            tasks,
            totalPages: Math.ceil(totalTasks / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Edit task for authenticated user
exports.updateTask = async (req, res) => {
    const { title, description, completed } = req.body;

    try {
        const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.completed = completed === undefined ? task.completed : completed;

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error });
    }
};

// Delete task for authenticated user
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.taskId, user: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error });
    }
};

// Admin: Get all users and their tasks
exports.getAllUsersAndTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('user', 'name email role');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all users and tasks', error });
    }
};
