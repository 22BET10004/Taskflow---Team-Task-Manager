const express = require('express');
const cors = require('cors');
const path = require('path');
const { init } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize DB then mount routes
init().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
  }

  app.listen(PORT, () => console.log(`TaskFlow running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
