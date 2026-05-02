import { useState, useEffect } from 'react';
import api from '../api';

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export default function TaskModal({ projectId, task, members, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
      let data;
      if (isEdit) {
        ({ data } = await api.put(`/projects/${projectId}/tasks/${task.id}`, payload));
      } else {
        ({ data } = await api.post(`/projects/${projectId}/tasks`, payload));
      }
      onSave(data, isEdit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Task name…" value={form.title} onChange={set('title')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="More details…" value={form.description} onChange={set('description')} rows={2} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assigned_to} onChange={set('assigned_to')}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={set('due_date')} />
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{width:14,height:14}} /> Saving…</> : (isEdit ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
