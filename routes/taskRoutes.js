const express = require('express');
const { createTask, getUserTasks, updateTask, deleteTask, getAllUsersAndTasks } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const multer = require('multer');
const Task = require('../models/Task');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

const router = express.Router();

// Authenticated user routes
router.post('/task', authMiddleware('user'), createTask);
router.get('/tasks', authMiddleware('user'), getUserTasks);
router.put('/task/:taskId', authMiddleware('user'), updateTask);
router.delete('/task/:taskId', authMiddleware('user'), deleteTask);

// Admin routes
router.get('/admin/tasks', authMiddleware('admin'), getAllUsersAndTasks);

// Export tasks to CSV
router.get('/tasks/export', authMiddleware('user'), async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id });
        const csvWriter = createCsvWriter({
            path: path.join(__dirname, 'tasks.csv'),
            header: [
                { id: 'title', title: 'Title' },
                { id: 'description', title: 'Description' },
                { id: 'dueDate', title: 'Due Date' },
                { id: 'priority', title: 'Priority' },
                { id: 'status', title: 'Status' },
                { id: 'assignedUser', title: 'Assigned User' }
            ]
        });

        await csvWriter.writeRecords(tasks.map(task => ({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.toISOString().split('T')[0],
            priority: task.priority,
            status: task.completed ? 'Completed' : 'Pending',
            assignedUser: task.assignedUser ? task.assignedUser.name : 'None'
        })));

        res.download(path.join(__dirname, 'tasks.csv'), 'tasks.csv', (err) => {
            if (err) {
                res.status(500).json({ msg: 'Error exporting tasks to CSV' });
            }
            fs.unlinkSync(path.join(__dirname, 'tasks.csv'));
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Import tasks from CSV
router.post('/tasks/import', authMiddleware('user'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const errors = [];
    const tasks = [];

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', async (row) => {
            try {
                // Validate row data
                if (!row.title || !row.dueDate || !row.priority || !row.status) {
                    errors.push({ row: row, error: 'Missing required fields' });
                    return;
                }

                const dueDate = new Date(row.dueDate);
                if (dueDate < new Date()) {
                    errors.push({ row: row, error: 'Due date cannot be in the past' });
                    return;
                }

                if (row.status !== 'Completed' && row.status !== 'Pending') {
                    errors.push({ row: row, error: 'Invalid status' });
                    return;
                }

                // Check for duplicates
                const existingTask = await Task.findOne({ title: row.title, userId: req.user.id });
                if (existingTask) {
                    errors.push({ row: row, error: 'Duplicate task title' });
                    return;
                }

                // Create task
                tasks.push({
                    userId: req.user.id,
                    title: row.title,
                    description: row.description,
                    dueDate: dueDate,
                    priority: row.priority,
                    completed: row.status === 'Completed'
                });
            } catch (err) {
                errors.push({ row: row, error: err.message });
            }
        })
        .on('end', async () => {
            if (errors.length) {
                fs.unlinkSync(req.file.path);
                // Generate error report
                const errorCsvWriter = createCsvWriter({
                    path: path.join(__dirname, 'errors.csv'),
                    header: [
                        { id: 'row', title: 'Row' },
                        { id: 'error', title: 'Error' }
                    ]
                });

                await errorCsvWriter.writeRecords(errors);
                res.status(400).json({ msg: 'Import completed with errors', errorsFile: 'errors.csv' });
            } else {
                await Task.insertMany(tasks);
                fs.unlinkSync(req.file.path);
                res.status(200).json({ msg: 'Tasks imported successfully' });
            }
        });
});

module.exports = router;
