require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDb = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on port ${PORT}`);
      console.log(`Local:   http://localhost:${PORT}`);
      console.log(`Network: http://<your-ip>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });

module.exports = app;
