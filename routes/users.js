const express = require('express');
const bcryptjs = require('bcryptjs');
const pool = require('./shared/pool');
const users = express.Router();

users.post('/signup', (req, res) => {
    try {
        const { firstName, lastName, address, city, state, pin, email, password } = req.body || {};

        if (!firstName || !lastName || !address || !city || !state || !pin || !email || !password) {
            return res.status(400).send('Missing required fields');
        }

        pool.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email], (error, resultCount) => {
            if (error) {
                return res.status(500).send(error);
            }

            if (resultCount[0].count > 0) {
                return res.status(200).send('Email already exist');
            }

            bcryptjs.hash(password, 10)
                .then((hashedPassword) => {
                    const query = `INSERT INTO users (email, firstName, lastName, address, city, state, pin, password)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                    pool.query(query, [email, firstName, lastName, address, city, state, pin, hashedPassword], (insertError) => {
                        if (insertError) {
                            return res.status(500).send(insertError);
                        }

                        return res.status(201).send('success');
                    });
                })
                .catch((hashError) => {
                    return res.status(500).send(hashError);
                });
        });
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = users;