var Disk, exports;

Disk = (function() {

  function Disk(name, status, size) {
    this.name = name;
    this.status = status != null ? status : 'UNKNOWN';
    this.size = size != null ? size : 0;
    this.id = require('./uniqid')(this.name);
  }

  return Disk;

})();

module.exports = exports = Disk;
