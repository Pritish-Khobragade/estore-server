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

orders.get('/allorders', checkToken, (req, res) => {
    try {
        const userId = req.auth.id;
        const query = `SELECT orderId, userName, address, city, state, pin, total,
            DATE_FORMAT(orderDate, '%m/%d/%Y') AS orderDate
            FROM orders
            WHERE userId = ?`;

        pool.query(query, [userId], (error, result) => {
            if (error) {
                return res.status(500).send({
                    error: error.code,
                    message: error.message
                });
            }

            const allOrders = [];
            result.forEach((order) => {
                allOrders.push({
                    orderId: order.orderId,
                    userName: order.userName,
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    pin: order.pin,
                    total: order.total,
                    orderDate: order.orderDate
                });
            });

            return res.status(200).send(allOrders);
        });
    } catch (error) {
        return res.status(400).send({
            error: error.code,
            message: error.message
        });
    }
});

orders.get('/orderproducts', checkToken, (req, res) => {
    try {
        const orderIdValue = req.query.orderId !== undefined
            ? req.query.orderId
            : req.body && req.body.orderId;
        const orderId = Number(orderIdValue);
        const userId = req.auth.id;

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).send({ message: 'A valid orderId is required.' });
        }

        const query = `SELECT orderDetails.productId, products.product_name AS productName,
            orderDetails.qty, orderDetails.price, orderDetails.amount
            FROM orderdetails AS orderDetails
            JOIN products ON orderDetails.productId = products.id
            JOIN orders ON orderDetails.orderId = orders.orderId
            WHERE orderDetails.orderId = ? AND orders.userId = ?`;

        pool.query(query, [orderId, userId], (error, result) => {
            if (error) {
                return res.status(500).send({
                    error: error.code,
                    message: error.message
                });
            }

            const orderDetails = [];
            result.forEach((orderProduct) => {
                orderDetails.push({
                    productId: orderProduct.productId,
                    productName: orderProduct.productName,
                    qty: orderProduct.qty,
                    price: orderProduct.price,
                    amount: orderProduct.amount
                });
            });

            return res.status(200).send(orderDetails);
        });
    } catch (error) {
        return res.status(400).send({
            error: error.code,
            message: error.message
        });
    }
});

module.exports = orders;
