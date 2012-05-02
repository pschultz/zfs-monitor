var ZfsAnalyser, exports;

ZfsAnalyser = (function() {

  function ZfsAnalyser(pool) {
    this.pool = pool;
  }

  ZfsAnalyser.prototype.analyse = function(zfsOutput) {
    var available, filesystems, fs, fsSize, i, isNonLeafFilesystem, lastFs, line, lines, name, poolName, referenced, snapshots, used, usedBySnapshot, _ref, _ref2;
    this.zfsOutput = zfsOutput;
    lines = this.zfsOutput;
    snapshots = new Filesystem('@snapshots', 0);
    lastFs = {
      name: '/'
    };
    filesystems = [];
    for (i = _ref = lines.length - 1; _ref <= 1 ? i <= 1 : i >= 1; _ref <= 1 ? i++ : i--) {
      line = lines[i];
      if (!line) continue;
      _ref2 = line.split(/\s+/), name = _ref2[0], used = _ref2[1], available = _ref2[2], referenced = _ref2[3], usedBySnapshot = _ref2[4];
      poolName = this.pool.name;
      isNonLeafFilesystem = name !== poolName && lastFs.name.indexOf(name) === 0;
      if (isNonLeafFilesystem) continue;
      if (name === poolName) {
        this.pool.size = normalizeBytes(used) + normalizeBytes(available);
        snapshots.size += normalizeBytes(usedBySnapshot);
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
