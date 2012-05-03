var Filesystem, exports;

Filesystem = (function() {

  function Filesystem(name, size) {
    this.name = name;
    this.size = size != null ? size : 0;
    this.id = require('./uniqid')(this.name);
  }

  return Filesystem;

})();

module.exports = exports = Filesystem;
