const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
        // Extract token
        token = token.split(' ')[1];
    } else {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains id, username, role
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Requires admin privileges.' });
    }
    next();
};
