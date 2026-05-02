import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </Link>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-text">Create your first project to start tracking tasks and collaborating with your team.</div>
            <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: 8 }}>Create Project</Link>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(p => (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge badge-${p.role}`}>{p.role}</span>
                    <svg width="14" height="14" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                  <div className="project-name">{p.name}</div>
                  {p.description && <div className="project-desc mt-2">{p.description}</div>}
                </div>
                <div className="project-footer">
                  <div className="project-stats">
                    <span className="project-stat">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                      {p.task_count} tasks
                    </span>
                    <span className="project-stat">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      {p.member_count} members
                    </span>
                  </div>
                  <span className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
