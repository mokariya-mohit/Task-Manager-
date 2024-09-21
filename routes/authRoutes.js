const express = require('express');
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Register user or admin
router.post('/register', register);

// Login user or admin
router.post('/login', login);

// Example of protected route for admin only
router.get('/admin', authMiddleware('admin'), (req, res) => {
    res.send('Admin dashboard');
});

// Example of protected route for regular users
router.get('/user', authMiddleware('user'), (req, res) => {
    res.send('User dashboard');
});

module.exports = router;
