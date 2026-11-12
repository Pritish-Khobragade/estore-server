const express = require('express');
const cors = require('cors');
const products = require('./routes/products');
const productCategories = require('./routes/productcategories');
const users = require('./routes/users');
const app = express();
const PORT = 5001;
const bodyparser = require('body-parser');

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(bodyparser.json());     //Resolves the data received in the body of the request before it passes it passes it to the relevant route.
app.use(express.json());
app.use('/productCategories', productCategories);
app.use('/products', products);
app.use('/users', users);

const server = app.listen(PORT, () => {
    console.log('App is running on the port - 5001');
});