var Diskarray, exports;

Diskarray = (function() {

  function Diskarray(name, type, status) {
    this.name = name != null ? name : 'unnamed';
    this.type = type != null ? type : 'striped';
    this.status = status != null ? status : '';
    this.disks = [];
    this.id = require('./uniqid')(this.name);
  }

  return Diskarray;

})();

module.exports = exports = Diskarray;
