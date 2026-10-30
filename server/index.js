const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDB } = require('./db');

const suppliersRouter = require('./routes/suppliers');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Initialize database then start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Supplier Risk Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
