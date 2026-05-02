import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';

export default function NewProject() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      navigate(`/projects/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Project</h1>
          <p className="page-subtitle">Set up a new workspace for your team</p>
        </div>
        <Link to="/projects" className="btn btn-secondary">Cancel</Link>
      </div>

      <div className="page-body" style={{ maxWidth: 520 }}>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What's this project about?" value={form.description} onChange={set('description')} rows={3} />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <Link to="/projects" className="btn btn-secondary">Cancel</Link>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" style={{width:14,height:14}} /> Creating…</> : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
