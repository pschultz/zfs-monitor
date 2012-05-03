var Scan, exports;

Scan = (function() {

  function Scan(poolName, type, progress, eta) {
    this.poolName = poolName;
    this.type = type;
    this.progress = progress != null ? progress : 0;
    this.eta = eta != null ? eta : 0;
    this.id = require('./uniqid')("" + this.poolName + "-" + this.type);
  }

  Scan.prototype.equals = function(rhs) {
    return this.progress === rhs.progress && this.eta === rhs.eta;
  };

  return Scan;

})();

module.exports = exports = Scan;
