// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (role) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user || (role && user.role !== role)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            req.user = user; // Attach user to request
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(401).json({ message: 'Invalid token' });
        }
    };
};

module.exports = authMiddleware;
