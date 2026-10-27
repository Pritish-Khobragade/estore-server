const express = require('express');
const cors = require('cors');
const productCategories = require('./routes/productcategories');
const app = express();
const PORT = 5001;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use('/productCategories',productCategories);

const server = app.listen(PORT, () => {
    console.log('App is running on the port - 5001');

}); 