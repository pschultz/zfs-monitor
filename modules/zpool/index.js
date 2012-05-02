var ZPool, exports;

ZPool = (function() {

  function ZPool(name, status) {
    this.name = name;
    this.status = status != null ? status : 'UNKNOWN';
    this.size = 0;
    this.allocated = 0;
    this.scans = [];
    this.diskArrays = [];
    this.filesystems = [];
    this.id = require('crypto').createHash('md5').update(this.name).digest('hex');
  }

  ZPool.prototype.addDiskarray = function(array) {
    return this.diskArrays.push(array);
  };

  ZPool.prototype.addScan = function(scan) {
    return this.scans.push(scan);
  };

  return ZPool;

})();

module.exports = exports = ZPool;
