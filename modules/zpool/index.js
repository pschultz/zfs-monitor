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
    this.id = require('./uniqid')(this.name);
  }

  ZPool.prototype.addDiskarray = function(array) {
    return this.diskArrays.push(array);
  };

  ZPool.prototype.addScan = function(scan) {
    return this.scans.push(scan);
  };

  ZPool.prototype.addFilesystem = function(fs) {
    return this.filesystems.push(fs);
  };

  ZPool.prototype.equals = function(rhs) {
    return this.size === rhs.size && this.allocated === rhs.allocated && this.status === rhs.status;
  };

  return ZPool;

})();

module.exports = exports = ZPool;
