var createHash, exports;

createHash = require('crypto').createHash;

module.exports = exports = function(source) {
  return createHash('md5').update(source).digest('hex').substr(0, 8);
};
