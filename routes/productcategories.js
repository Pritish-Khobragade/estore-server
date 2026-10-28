const express = require('express');
const productCategories = express.Router();
const pool = require('./shared/pool');
const products = require('./products');


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