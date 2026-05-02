const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_dev_key_change_in_prod';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.get('SELECT id, name, email FROM users WHERE id = ?', [payload.userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireProjectRole = (roles) => (req, res, next) => {
  const { projectId } = req.params;
  const member = db.get(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id]
  );
  if (!member || !roles.includes(member.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  req.projectRole = member.role;
  next();
};

module.exports = { authenticate, requireProjectRole, JWT_SECRET };
