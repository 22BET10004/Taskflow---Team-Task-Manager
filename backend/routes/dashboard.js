const router = require('express').Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const projectCount = (db.get(
    'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?', [userId]) || {}).count || 0;

  const myProjects = db.all('SELECT project_id FROM project_members WHERE user_id = ?', [userId])
    .map(r => r.project_id);

  if (myProjects.length === 0) {
    return res.json({
      projectCount: 0, totalTasks: 0, myTasks: 0, overdueTasks: 0,
      tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
      recentTasks: [], upcomingDue: []
    });
  }

  const ph = myProjects.map(() => '?').join(',');

  const statusRows = db.all(
    `SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${ph}) AND assigned_to = ? GROUP BY status`,
    [...myProjects, userId]);
  const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
  statusRows.forEach(r => { tasksByStatus[r.status] = r.count; });

  const myTasks = (db.get(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${ph}) AND assigned_to = ?`,
    [...myProjects, userId]) || {}).count || 0;

  const totalTasks = (db.get(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${ph})`,
    myProjects) || {}).count || 0;

  const overdueTasks = (db.get(
    `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${ph}) AND assigned_to = ? AND due_date < ? AND status != 'done'`,
    [...myProjects, userId, today]) || {}).count || 0;

  const recentTasks = db.all(`
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${ph}) ORDER BY t.updated_at DESC LIMIT 5`, myProjects);

  const upcomingDue = db.all(`
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${ph}) AND t.assigned_to = ? AND t.due_date >= ? AND t.status != 'done'
    ORDER BY t.due_date ASC LIMIT 5`, [...myProjects, userId, today]);

  res.json({ projectCount, totalTasks, myTasks, overdueTasks, tasksByStatus, recentTasks, upcomingDue });
});

module.exports = router;
