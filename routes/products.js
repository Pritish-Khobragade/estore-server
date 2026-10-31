const express = require('express');
const products = express.Router();
const pool = require('./shared/pool');

products.get('/', (req, res) => {
    var mainCategoryId = req.query.mainCategoryId;
    var subCategoryId = req.query.subCategoryId || req.query.subcategoryid;

    let query = 'select * from products';
    if (subCategoryId) {
        query = `select products.* from products, categories where products.category_id = categories.id and categories.id = ${subCategoryId}`;
    }

    pool.query(query, (error, products) => {
        if (error) {
            res.status(500).send(error);
        } else if (products.length === 0) {
            res.status(200).send([]);
        } else {
            res.status(200).send(products);
        }
    });
});

products.get('/:id', (req, res) => {
    let id = req.params.id;
    pool.query('select * from products where id = ' + id, (error, products) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.status(200).send(products);
        }
    })
})

module.exports = products;