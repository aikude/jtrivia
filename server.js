const express = require('express');
const path = require('path');

const SERVER_PORT = process.env.PORT || 5000;

const app = express();

// Frontend requests via static folder (public)
app.use(express.static(path.join(__dirname, 'public')));

// Route api requests - questions-related
app.use('/api/questions', require('./api/controllers/questions'));

app.listen(SERVER_PORT, () => console.log(`Server running on port: ${SERVER_PORT}`));
