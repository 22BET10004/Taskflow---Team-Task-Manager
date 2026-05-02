const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.run('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
    [id, name.trim(), email.toLowerCase(), hash]);

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id, name: name.trim(), email: email.toLowerCase() } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
