const cron = require('node-cron');
const Task = require('../models/Task');
const nodemailer = require('nodemailer');

// Configure email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

cron.schedule('* * * * *', async () => {
    const tasks = await Task.find({ dueDate: { $gte: new Date() }, completed: false });
    tasks.forEach(task => {
        // Send reminder email
        transporter.sendMail({
            to: task.user.email,
            subject: `Reminder: Task "${task.title}" is due soon!`,
            text: `Your task "${task.title}" is due on ${task.dueDate}. Please complete it on time.`,
        });
    });
});
