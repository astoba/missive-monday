
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Serve static files without caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false
}));

// Import route modules
const viewRoutes = require('./routes/view-routes');
const apiRoutes = require('./routes/api-routes');

// Mount the routes
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure MONDAY_API_KEY is set in Replit Secrets.');
  console.log(`Missive integration UI: YOUR_REPLIT_URL/missive.html`);
  console.log(`Main item list page: YOUR_REPLIT_URL/`);
});
