const express = require('express');
const pool = require('./shared/pool');
const orders = express.Router();
const checkToken = require('./shared/checktoken');

orders.post('/add', checkToken, (req, res) => {
    try {
        let userName = req.body.userName;
        let userEmail = req.body.userEmail;
        let address = req.body.address;
        let city = req.body.city;
        let state = req.body.state;
        let pin = req.body.pin;
        let total = req.body.total;
        let orderDetails = req.body.orderDetails;

        pool.query('SELECT id FROM users WHERE email = ?', [userEmail], (error, user) => {
            if (error) {
                return res.status(500).send({
                    error: error.code,
                    message: error.message
                });
            } else {
                if (user.length > 0) {
                    let userId = user[0].id;
                    const query = `INSERT INTO orders (userId, userName, address, city, state, pin, total)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

                    pool.query(query, [userId, userName, address, city, state, pin, total], (error, result) => {
                        if (error) {
                            return res.status(500).send({
                                error: error.code,
                                message: error.message
                            });
                        } else {
                            let orderId = result.insertId;
                            let pendingDetails = orderDetails.length;
                            let responseSent = false;

                            if (pendingDetails === 0) {
                                return res.status(201).send({ message: 'success', orderId });
                            }

                            orderDetails.forEach((item) => {
                                const detailsQuery = `INSERT INTO orderdetails
                                    (orderId, productId, qty, price, amount)
                                    VALUES (?, ?, ?, ?, ?)`;

                                pool.query(
                                    detailsQuery,
                                    [orderId, item.productId, item.qty, item.price, item.amount],
                                    (detailsError) => {
                                        if (detailsError) {
                                            if (!responseSent) {
                                                responseSent = true;
                                                return res.status(500).send({
                                                    error: detailsError.code,
                                                    message: detailsError.message
                                                });
                                            }
                                            return;
                                        }

                                        pendingDetails -= 1;
                                        if (pendingDetails === 0 && !responseSent) {
                                            responseSent = true;
                                            return res.status(201).send({ message: 'success', orderId });
                                        }
                                    }
                                );
                            });
                        }
                    });
                } else {
                    return res.status(404).send({ message: "User doesn't exist." });
                }
            }
        });
    } catch (error) {
        return res.status(400).send({
            error: error.code,
            message: error.message
        });
    }
});

module.exports = orders;
