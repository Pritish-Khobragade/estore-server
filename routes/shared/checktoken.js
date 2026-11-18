const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization;
        const user = jwt.verify(token, 'estore-secret-key');

        if (typeof user !== 'object' || user === null || !user.id) {
            return res.status(401).send({ message: 'Authorization failed' });
        }

        req.auth = user;
        next();
    } catch {
        return res.status(401).send({ message: 'Authorization failed' });
    }
}


