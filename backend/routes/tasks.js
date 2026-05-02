const router = require('express').Router({ mergeParams: true });
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, requireProjectRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireProjectRole(['admin', 'member']));

router.get('/', (req, res) => {
  const { status, assigned_to, priority } = req.query;
  let query = `
    SELECT t.*, u1.name as assigned_to_name, u1.email as assigned_to_email, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.project_id = ?`;
  const params = [req.params.projectId];
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (assigned_to) { query += ' AND t.assigned_to = ?'; params.push(assigned_to); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  query += ' ORDER BY t.created_at DESC';
  res.json(db.all(query, params));
});

router.post('/', (req, res) => {
  const { title, description, priority, assigned_to, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });
  if (assigned_to) {
    const member = db.get('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, assigned_to]);
    if (!member) return res.status(400).json({ error: 'Assigned user is not a project member' });
  }
  const id = uuidv4();
  const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
  db.run(`INSERT INTO tasks (id, project_id, title, description, priority, assigned_to, created_by, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.projectId, title.trim(), description || '', validPriority,
      assigned_to || null, req.user.id, due_date || null]);
  const task = db.get(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assigned_to LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?`, [id]);
  res.status(201).json(task);
});

router.put('/:taskId', (req, res) => {
  const task = db.get('SELECT * FROM tasks WHERE id = ? AND project_id = ?',
    [req.params.taskId, req.params.projectId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.projectRole === 'member' && task.created_by !== req.user.id && task.assigned_to !== req.user.id)
    return res.status(403).json({ error: 'You can only edit your own tasks' });

  const { title, description, status, priority, assigned_to, due_date } = req.body;
  const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : task.status;
  const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : task.priority;

  if (assigned_to && assigned_to !== task.assigned_to) {
    const member = db.get('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, assigned_to]);
    if (!member) return res.status(400).json({ error: 'Assigned user is not a project member' });
  }

  db.run(`UPDATE tasks SET title=?, description=?, status=?, priority=?, assigned_to=?, due_date=?,
    updated_at=datetime('now') WHERE id=?`,
    [title || task.title, description !== undefined ? description : task.description,
      validStatus, validPriority,
      assigned_to !== undefined ? (assigned_to || null) : task.assigned_to,
      due_date !== undefined ? (due_date || null) : task.due_date,
      req.params.taskId]);

  const updated = db.get(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assigned_to LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?`, [req.params.taskId]);
  res.json(updated);
});

router.delete('/:taskId', (req, res) => {
  const task = db.get('SELECT * FROM tasks WHERE id = ? AND project_id = ?',
    [req.params.taskId, req.params.projectId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.projectRole === 'member' && task.created_by !== req.user.id)
    return res.status(403).json({ error: 'Only admins or the task creator can delete tasks' });
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.taskId]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
