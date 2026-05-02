import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const statusCols = [
  { key: 'todo', label: 'To Do', color: 'var(--text-2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'done', label: 'Done', color: 'var(--green)' }
];

const priorityDot = { low: '#8888a8', medium: '#f5c842', high: '#ff5f5f' };

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((date - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Today', overdue: false };
  return { label: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [myRole, setMyRole] = useState('member');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMsg, setInviteMsg] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const loadAll = async () => {
    try {
      const [pRes, tRes, mRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/members`)
      ]);
      setProject(pRes.data);
      setMyRole(pRes.data.role);
      setTasks(tRes.data);
      setMembers(mRes.data);
      setEditForm({ name: pRes.data.name, description: pRes.data.description });
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [projectId]);

  const handleTaskSave = (savedTask, isEdit) => {
    if (isEdit) {
      setTasks(ts => ts.map(t => t.id === savedTask.id ? savedTask : t));
    } else {
      setTasks(ts => [savedTask, ...ts]);
    }
    setShowTaskModal(false);
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    setTasks(ts => ts.filter(t => t.id !== taskId));
  };

  const handleStatusChange = async (task, newStatus) => {
    const { data } = await api.put(`/projects/${projectId}/tasks/${task.id}`, { ...task, status: newStatus });
    setTasks(ts => ts.map(t => t.id === data.id ? data : t));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg('');
    try {
      await api.post(`/projects/${projectId}/members`, { email: inviteEmail, role: inviteRole });
      setInviteMsg('✓ Member added!');
      setInviteEmail('');
      const { data } = await api.get(`/projects/${projectId}/members`);
      setMembers(data);
    } catch (err) {
      setInviteMsg('✗ ' + (err.response?.data?.error || 'Error'));
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${projectId}/members/${userId}`);
    setMembers(ms => ms.filter(m => m.id !== userId));
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const { data } = await api.put(`/projects/${projectId}`, editForm);
    setProject(data);
    setEditingProject(false);
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return;
    await api.delete(`/projects/${projectId}`);
    navigate('/projects');
  };

  if (loading) return <Layout><div className="loading-screen"><div className="spinner" /></div></Layout>;

  const tasksByStatus = {};
  statusCols.forEach(c => { tasksByStatus[c.key] = tasks.filter(t => t.status === c.key); });

  return (
    <Layout>
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Link to="/projects" className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              Projects
            </Link>
            <span className="text-muted text-sm">/</span>
          </div>
          <h1 className="page-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project?.name}</h1>
          {project?.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        {(myRole === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        )}
        {myRole === 'member' && (
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="tabs">
          {['board', 'list', 'members', ...(myRole === 'admin' ? ['settings'] : [])].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* BOARD VIEW */}
        {tab === 'board' && (
          <div className="kanban">
            {statusCols.map(col => (
              <div key={col.key} className="kanban-col">
                <div className="kanban-header">
                  <span className="kanban-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                    {col.label}
                  </span>
                  <span className="kanban-count">{tasksByStatus[col.key].length}</span>
                </div>
                <div className="kanban-body">
                  {tasksByStatus[col.key].length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 13, padding: '20px 0' }}>Empty</div>
                  ) : tasksByStatus[col.key].map(task => {
                    const due = formatDate(task.due_date);
                    return (
                      <div key={task.id} className="task-card" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>
                        <div className="task-info">
                          <div className={`task-title${task.status === 'done' ? ' done' : ''}`}>{task.title}</div>
                          <div className="task-meta">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityDot[task.priority] || '#888', flexShrink: 0 }} />
                            {task.assigned_to_name && (
                              <span className="task-meta-item">
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                                {task.assigned_to_name}
                              </span>
                            )}
                            {due && (
                              <span className={`task-meta-item${due.overdue ? ' overdue' : ''}`}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                                {due.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ flexShrink: 0 }}
                          onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {tab === 'list' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">No tasks yet</div>
                <div className="empty-state-text">Add your first task to get started.</div>
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowTaskModal(true)}>Add Task</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Task', 'Status', 'Priority', 'Assigned', 'Due', ''].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => {
                    const due = formatDate(task.due_date);
                    return (
                      <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => { setEditTask(task); setShowTaskModal(true); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 14 }}>{task.title}</td>
                        <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                        <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{task.assigned_to_name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>
                          {due ? <span style={{ color: due.overdue ? 'var(--red)' : 'var(--text-2)' }}>{due.label}</span> : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {myRole === 'admin' && (
              <div className="card">
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>Invite Member</h3>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Email address" type="email"
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  <select className="form-select" style={{ width: 120 }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn btn-primary" type="submit">Invite</button>
                </form>
                {inviteMsg && <p style={{ marginTop: 8, fontSize: 13, color: inviteMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{inviteMsg}</p>}
              </div>
            )}
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Members ({members.length})</h3>
              {members.map(m => (
                <div key={m.id} className="member-item">
                  <div className="flex items-center gap-3">
                    <div className="avatar sm">{m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {myRole === 'admin' && m.id !== user.id && project.owner_id !== m.id && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleRemoveMember(m.id)} title="Remove">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && myRole === 'admin' && (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Project Settings</h3>
              <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" type="submit">Save Changes</button>
                </div>
              </form>
            </div>
            {project.owner_id === user.id && (
              <div className="card" style={{ borderColor: '#ff5f5f30' }}>
                <h3 style={{ fontSize: 15, marginBottom: 6, color: 'var(--red)' }}>Danger Zone</h3>
                <p className="text-sm text-muted" style={{ marginBottom: 14 }}>Deleting a project permanently removes all tasks and data.</p>
                <button className="btn btn-danger" onClick={handleDeleteProject}>Delete Project</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          members={members}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleTaskSave}
        />
      )}
    </Layout>
  );
}
