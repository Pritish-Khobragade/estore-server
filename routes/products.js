const express = require('express');
const products = express.Router();
const pool = require('./shared/pool');

products.get('/', (req, res) => {
    const rawSubCategoryId = req.query.subCategoryId || req.query.subcategoryid;
    const rawMainCategoryId = req.query.mainCategoryId;
    const rawCategoryId = rawSubCategoryId || rawMainCategoryId;
    const categoryId = Number(rawCategoryId);
    var keyword = req.query.keyword;

    const rawProductFor = req.query.productFor;
    let productFor;

    if (rawProductFor !== undefined) {
        if (typeof rawProductFor !== 'string') {
            return res.status(400).send('Invalid productFor value');
        }

        switch (rawProductFor.trim().toLowerCase()) {
            case 'men':
                productFor = 'Men';
                break;
            case 'women':
                productFor = 'Women';
                break;
            case 'kids':
            case 'children':
                productFor = 'Kids';
                break;
            default:
                return res.status(400).send('productFor must be Men, Women, or Kids');
        }
    }

    if (rawCategoryId !== undefined && (!Number.isInteger(categoryId) || categoryId <= 0)) {
        return res.status(400).send('Category id must be a positive integer');
    }

    let query = 'select * from products';
    let queryParams = [];
    if (rawSubCategoryId) {
        query = 'select products.* from products where products.category_id = ?';
        queryParams = [categoryId];
    } else if (rawMainCategoryId) {
        query = `select distinct products.* from products
            left join categories on products.category_id = categories.id
            where (products.category_id = ? or categories.parent_category = ?)`;
        queryParams = [categoryId, categoryId];
    }

    if (productFor !== undefined) {
        query += queryParams.length > 0
            ? ' and lower(trim(products.product_for)) = lower(?)'
            : ' where lower(trim(products.product_for)) = lower(?)';
        queryParams.push(productFor);
    }

    if (typeof keyword === 'string' && keyword.trim()) {
        query += queryParams.length > 0
            ? ' and (products.product_name like ? or products.product_description like ?)'
            : ' where (products.product_name like ? or products.product_description like ?)';
        const keywordPattern = `%${keyword.trim()}%`;
        queryParams.push(keywordPattern, keywordPattern);
    }

    pool.query(query, queryParams, (error, products) => {
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send('Product id must be a positive integer');
    }

    pool.query('select * from products where id = ?', [id], (error, products) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.status(200).send(products[0] ?? null);
        }
    })
})

module.exports = products;