var Filesystem, ZfsAnalyser, exports, normalizeBytes;

Filesystem = require('../../zpool/filesystem');

normalizeBytes = function(input) {
  var e, nil, numeric, pattern, suffix, _len, _ref, _ref2;
  _ref = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  for (e = 0, _len = _ref.length; e < _len; e++) {
    suffix = _ref[e];
    pattern = new RegExp("^([+-]?[\\d.]+)" + suffix + "$", 'i');
    if (pattern.test(input)) {
      _ref2 = pattern.exec(input), nil = _ref2[0], numeric = _ref2[1];
      return Math.round(numeric * Math.pow(1024, e));
    }
  }
  return 0;
};

ZfsAnalyser = (function() {

  function ZfsAnalyser(pool) {
    this.pool = pool;
  }

  ZfsAnalyser.prototype.parse = function(lines) {
    var available, filesystems, fs, fsSize, i, isNonLeafFilesystem, lastFs, line, name, poolName, referenced, snapshots, used, usedBySnapshot, _ref, _ref2;
    snapshots = new Filesystem('@snapshots', 0);
    lastFs = {
      name: '/'
    };
    filesystems = [];
    poolName = this.pool.name;
    for (i = _ref = lines.length - 1; _ref <= 1 ? i <= 1 : i >= 1; _ref <= 1 ? i++ : i--) {
      line = lines[i];
      if (!line) continue;
      _ref2 = line.split(/\s+/), name = _ref2[0], used = _ref2[1], available = _ref2[2], referenced = _ref2[3], usedBySnapshot = _ref2[4];
      snapshots.size += normalizeBytes(usedBySnapshot);
      isNonLeafFilesystem = name !== poolName && lastFs.name.indexOf(name) === 0;
      if (isNonLeafFilesystem) continue;
      if (name === poolName) {
        this.pool.size = normalizeBytes(used) + normalizeBytes(available);
        continue;
      }
      fsSize = normalizeBytes(referenced);
      this.pool.allocated += fsSize;
      fs = new Filesystem(name, fsSize);
      lastFs = fs;
      this.pool.addFilesystem(fs);
    }
    this.pool.addFilesystem(snapshots);
    return this.pool;
  };

  return ZfsAnalyser;

})();

module.exports = exports = ZfsAnalyser;
