var Filesystem, exports;

Filesystem = (function() {

  function Filesystem(name, size) {
    this.name = name;
    this.size = size != null ? size : 0;
    this.id = require('./uniqid')(this.name);
  }

  Filesystem.prototype.equals = function(rhs) {
    return this.size === rhs.size;
  };

  return Filesystem;

})();

module.exports = exports = Filesystem;
