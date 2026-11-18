const express = require('express');
const bcryptjs = require('bcryptjs');
const pool = require('./shared/pool');
const users = express.Router();
const jwttoken = require('jsonwebtoken');

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

users.post('/login',(req,res)=>{
try {
    let email = req.body.email;
    let password = req.body.password;

    pool.query(
        'SELECT id, email, password, firstName AS firstName, lastName AS lastName, address, city, state, pin FROM users WHERE email = ?',
        [email],
        (error, result)=>{
        if(error) {
            res.status(500).send({
                error: error.code,
                message: error.message
            });
        } else {
            if(result.length > 0){
                bcryptjs
                .compare(password, result[0].password)
                .then((compareResult)=>{
                    if(compareResult) {
                        const token = jwttoken.sign(
                            {
                                id: result[0].id,
                                email: result[0].email,
                            },
                            'estore-secret-key',
                            { expiresIn: '1h' }
                        );
                        res.status(200).send({
                            token: token,
                            expiresInSeconds: 3600,
                            user:{
                                firstName: result[0].firstName,
                                lastName: result[0].lastName,
                                address: result[0].address,
                                city: result[0].city,
                                state: result[0].state,
                                pin: result[0].pin,
                            }
                        });
                    }else{
                        res.status(401).send({
                            message: 'Invalid password', 
                        });
                    }
                });
            } else {
                res.status(401).send({
                    message: `User doesn't exist`,
                });
            }
        }
    });
}
catch( error){
    res.status(400).send({
        error: error.code,
        message: error.message,
    });
}
});

module.exports = users;