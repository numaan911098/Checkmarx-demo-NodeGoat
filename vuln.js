const express = require('express');
const app = express();

// Secret detection - API keys
const API_KEY = 'sk-1234567890abcdefghijklmnop';
const DB_PASSWORD = 'admin123';

app.get('/search', (req, res) => {
    // XSS vulnerability
    res.send('<h1>Results: ' + req.query.q + '</h1>');
});

app.get('/redirect', (req, res) => {
    // Unsafe redirect
    res.redirect(req.query.url);
});

module.exports = app;