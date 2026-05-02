const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, requireProjectRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const projects = db.all(`
    SELECT p.*, pm.role, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `, [req.user.id]);
  res.json(projects);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  const id = uuidv4();
  db.run('INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)',
    [id, name.trim(), description || '', req.user.id]);
  db.run('INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
    [uuidv4(), id, req.user.id, 'admin']);
  const project = db.get('SELECT * FROM projects WHERE id = ?', [id]);
  res.status(201).json(project);
});

router.get('/:projectId', requireProjectRole(['admin', 'member']), (req, res) => {
  const project = db.get(`
    SELECT p.*, pm.role, u.name as owner_name
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `, [req.user.id, req.params.projectId]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.put('/:projectId', requireProjectRole(['admin']), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  db.run('UPDATE projects SET name = ?, description = ? WHERE id = ?',
    [name.trim(), description || '', req.params.projectId]);
  res.json(db.get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]));
});

router.delete('/:projectId', requireProjectRole(['admin']), (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  if (project.owner_id !== req.user.id)
    return res.status(403).json({ error: 'Only the project owner can delete it' });
  db.run('DELETE FROM tasks WHERE project_id = ?', [req.params.projectId]);
  db.run('DELETE FROM project_members WHERE project_id = ?', [req.params.projectId]);
  db.run('DELETE FROM projects WHERE id = ?', [req.params.projectId]);
  res.json({ message: 'Project deleted' });
});

router.get('/:projectId/members', requireProjectRole(['admin', 'member']), (req, res) => {
  const members = db.all(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? ORDER BY pm.role DESC, u.name ASC
  `, [req.params.projectId]);
  res.json(members);
});

router.post('/:projectId/members', requireProjectRole(['admin']), (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const validRole = ['admin', 'member'].includes(role) ? role : 'member';
  const user = db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return res.status(404).json({ error: 'No user found with that email' });
  const existing = db.get('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [req.params.projectId, user.id]);
  if (existing) return res.status(409).json({ error: 'User is already a member' });
  db.run('INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
    [uuidv4(), req.params.projectId, user.id, validRole]);
  res.status(201).json({ message: 'Member added', user: { id: user.id, name: user.name, email: user.email, role: validRole } });
});

router.put('/:projectId/members/:userId', requireProjectRole(['admin']), (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ error: 'Role must be admin or member' });
  db.run('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
    [role, req.params.projectId, req.params.userId]);
  res.json({ message: 'Role updated' });
});

router.delete('/:projectId/members/:userId', requireProjectRole(['admin']), (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  if (project.owner_id === req.params.userId)
    return res.status(400).json({ error: 'Cannot remove project owner' });
  db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [req.params.projectId, req.params.userId]);
  res.json({ message: 'Member removed' });
});

module.exports = router;
