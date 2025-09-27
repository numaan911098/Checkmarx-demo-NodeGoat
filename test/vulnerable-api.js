// File 1: vulnerable-api.js (triggers Vorpal + 2MS)
const express = require('express');
const { exec } = require('child_process');
const app = express();

// Hard-coded secrets (triggers 2MS)
const API_KEY = 'sk-1234567890abcdefghijklmnopqrstuvwx';
const DATABASE_PASSWORD = 'admin123!@#$%';
const JWT_SECRET = 'super-secret-jwt-key-do-not-share';
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// Vulnerable code (triggers Vorpal)
app.get('/search', (req, res) => {
    // XSS vulnerability - directly outputting user input
    const query = req.query.q;
    res.send(`<h1>Search Results for: ${query}</h1>`);
});

app.post('/upload', (req, res) => {
    // Command injection vulnerability
    const filename = req.body.filename;
    exec(`cp /uploads/${filename} /processed/`, (error, stdout, stderr) => {
        if (error) {
            // Information disclosure
            res.status(500).send(`Error: ${error.stack}`);
            return;
        }
        res.send('File processed successfully');
    });
});

app.get('/redirect', (req, res) => {
    // Unsafe redirect
    const url = req.query.url;
    res.redirect(url);
});

app.get('/eval', (req, res) => {
    // Code injection vulnerability
    const code = req.query.code;
    try {
        const result = eval(code);
        res.json({ result });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// SQL injection vulnerability
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    // Simulated SQL execution
    res.json({ query, user: 'mock data' });
});

module.exports = app;