const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

const password = {
  async hash(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },
  
  async compararPassword(plainPassword, hashed) {
    return await bcrypt.compare(plainPassword, hashed);
  }
};

module.exports = password;