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
                return res.status(200).send({ message: 'Email already exists'});
            }

            bcryptjs.hash(password, 10)
                .then((hashedPassword) => {
                    const query = `INSERT INTO users (email, firstName, lastName, address, city, state, pin, password)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                    pool.query(query, [email, firstName, lastName, address, city, state, pin, hashedPassword], (error, result) => {
                        if (error) {
                            return res.status(401).send({
                                error: error.code,
                                message: error.message,
                            });
                        }

                        return res.status(201).send({ message: 'success' });
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