const express = require('express');
const productCategories = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'estore',
    port: 3306,
    multipleStatements: true    //Allows us to have multiple query statements.
});

productCategories.get('/', (req, res) => {
    pool.query(
        'select id, category, parent_category as parent_category_id from categories',
        (error, categories) => {
            if (error) {
                res.status(500).send(error);
            }
            else {
                res.status(200).send(categories);
            }
        });
});

module.exports = productCategories;