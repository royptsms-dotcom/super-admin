const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header     = req.headers['authorization'];
  const queryToken = req.query.token;
  const token      = queryToken || (header && header.split(' ')[1]);

  if (!token) return res.status(401).json({ error: 'Token tidak ada' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
  }
};