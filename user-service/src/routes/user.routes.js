const express = require('express');
const { registerUser, loginUser, refreshUserToken, logoutUser } = require('../controllers/user.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshUserToken);
router.post('/logout', logoutUser);

module.exports = router;
