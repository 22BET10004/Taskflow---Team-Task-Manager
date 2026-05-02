import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityColor = { low: '#8888a8', medium: '#f5c842', high: '#ff5f5f' };

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((date - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Due today', overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return (
    <Layout>
      <div className="loading-screen"><div className="spinner" /></div>
    </Layout>
  );

  const total = (stats?.tasksByStatus.todo || 0) + (stats?.tasksByStatus.in_progress || 0) + (stats?.tasksByStatus.done || 0);
  const donePercent = total > 0 ? Math.round((stats?.tasksByStatus.done / total) * 100) : 0;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </Link>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Projects</div>
            <div className="stat-value" style={{ color: '#6c63ff' }}>{stats?.projectCount ?? 0}</div>
            <div className="stat-sub">Total joined</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">My Tasks</div>
            <div className="stat-value" style={{ color: '#4fa3f7' }}>{stats?.myTasks ?? 0}</div>
            <div className="stat-sub">Assigned to you</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: '#2dd4a0' }}>{stats?.tasksByStatus?.done ?? 0}</div>
            <div className="stat-sub">{donePercent}% done</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${donePercent}%` }} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: stats?.overdueTasks > 0 ? '#ff5f5f' : '#2dd4a0' }}>
              {stats?.overdueTasks ?? 0}
            </div>
            <div className="stat-sub">{stats?.overdueTasks > 0 ? 'Need attention' : 'All on track!'}</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 15 }}>Recent Tasks</h2>
              <span className="text-xs text-muted">Latest updates</span>
            </div>
            {stats?.recentTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-text">No tasks yet. Create a project to get started!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats?.recentTasks?.map(task => {
                  const due = formatDate(task.due_date);
                  return (
                    <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColor[task.priority] || '#888', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{task.title}</span>
                        <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted" style={{ paddingLeft: 15 }}>
                        <span>📁 {task.project_name}</span>
                        {task.assigned_to_name && <span>👤 {task.assigned_to_name}</span>}
                        {due && <span className={due.overdue ? 'text-xs' : 'text-xs'} style={{ color: due.overdue ? 'var(--red)' : 'var(--text-2)' }}>⏰ {due.label}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Due */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: 15 }}>Upcoming Deadlines</h2>
                <span className="text-xs text-muted">Your tasks</span>
              </div>
              {stats?.upcomingDue?.length === 0 ? (
                <p className="text-sm text-muted" style={{ padding: '10px 0' }}>No upcoming deadlines 🎉</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats?.upcomingDue?.map(task => {
                    const due = formatDate(task.due_date);
                    return (
                      <div key={task.id} className="card card-sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                          <div className="text-xs text-muted mt-2">{task.project_name}</div>
                        </div>
                        {due && <span style={{ fontSize: 12, color: due.overdue ? 'var(--red)' : 'var(--yellow)', whiteSpace: 'nowrap' }}>{due.label}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h2 style={{ fontSize: 15, marginBottom: 14 }}>Task Breakdown</h2>
              {[
                { key: 'todo', label: 'To Do', color: 'var(--text-2)' },
                { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
                { key: 'done', label: 'Done', color: 'var(--green)' }
              ].map(({ key, label, color }) => {
                const count = stats?.tasksByStatus?.[key] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span style={{ color }}>{label}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
