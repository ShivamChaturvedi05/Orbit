const { sequelize } = require('../db/index');
const User = require('./user.model');
const RefreshToken = require('./refreshToken.model');

// Setup relationships
User.hasMany(RefreshToken, { onDelete: 'CASCADE' });
RefreshToken.belongsTo(User);

module.exports = { User, RefreshToken, sequelize };
