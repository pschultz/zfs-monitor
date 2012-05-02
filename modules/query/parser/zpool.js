var Disk, Diskarray, PoolParser, diskArrayStartPattern, exports, poolScanPattern, poolStatusPattern;

poolStatusPattern = /^ state: (\S+)/;

poolScanPattern = /^  scan: (resilver|scrub) in progress/;

diskArrayStartPattern = /^        NAME/;

Disk = require('../../zpool/disk');

Diskarray = require('../../zpool/array');

PoolParser = (function() {

  function PoolParser(pool) {
    this.pool = pool;
    this.stripeIndex = 0;
  }

  PoolParser.prototype.parse = function(lines) {
    var i, line, nil, _ref, _ref2;
    for (i = 0, _ref = lines.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      line = lines[i];
      if (poolStatusPattern.test(line)) {
        _ref2 = poolStatusPattern.exec(line), nil = _ref2[0], this.pool.status = _ref2[1];
        continue;
      }
      if (poolScanPattern.test(line)) {
        i = this.parseScans(lines, i);
        continue;
      }
      if (diskArrayStartPattern.test(line)) {
        i = this.parseDiskarrays(lines, i + 2);
        continue;
      }
    }
    return this.pool;
  };

  PoolParser.prototype.parseScans = function(lines, i) {
    var eta, etaPattern, hours, line, minutes, nil, percent, progress, progressPattern, type, _ref, _ref2, _ref3;
    eta = 0;
    progress = 0;
    line = lines[i];
    _ref = poolScanPattern.exec(line), nil = _ref[0], type = _ref[1];
    line = lines[++i];
    etaPattern = /(\d+)h(\d)+m to go/;
    if (etaPattern.test(line)) {
      _ref2 = etaPattern.exec(line), nil = _ref2[0], hours = _ref2[1], minutes = _ref2[2];
      eta = hours * 3600 + minutes * 60;
    }
    line = lines[++i];
    progressPattern = /([\d.]+)% done/;
    if (progressPattern.test(line)) {
      _ref3 = progressPattern.exec(line), nil = _ref3[0], percent = _ref3[1];
      progress = percent / 100;
    }
    this.pool.addScan({
      type: type,
      eta: eta,
      progress: progress
    });
    return i;
  };

  PoolParser.prototype.parseDiskarrays = function(lines, i) {
    var deviceName, deviceStatus, deviceType, disk, diskArray, indentLevel, isSpecialDevice, lastIndentLevel, leadingSpaces, line, linePattern, nil, specialDeviceNamePattern, _ref, _ref2, _ref3;
    linePattern = /^ +(\S+) *(\S+)?/;
    specialDeviceNamePattern = /^((raidz\d|mirror|logs|spares|cache)\S*)/;
    lastIndentLevel = Infinity;
    diskArray = null;
    for (i = i, _ref = lines.length - 1; i <= _ref ? i <= _ref : i >= _ref; i <= _ref ? i++ : i--) {
      line = lines[i];
      if (line.match(/^\s*$/)) break;
      leadingSpaces = /^ +/.exec(line)[0];
      indentLevel = leadingSpaces.length;
      _ref2 = linePattern.exec(line), nil = _ref2[0], deviceName = _ref2[1], deviceStatus = _ref2[2];
      deviceType = 'striped';
      isSpecialDevice = specialDeviceNamePattern.test(deviceName);
      if (isSpecialDevice) {
        _ref3 = specialDeviceNamePattern.exec(deviceName), nil = _ref3[0], deviceName = _ref3[1], deviceType = _ref3[2];
        diskArray = this.addDiskarray(deviceName, deviceType, deviceStatus);
        lastIndentLevel = indentLevel;
        continue;
      }
      if (indentLevel < lastIndentLevel) {
        diskArray = this.addDiskarray(deviceName, deviceType, deviceStatus);
        lastIndentLevel = indentLevel;
        if (diskArray.type !== 'striped') continue;
      }
      disk = new Disk(deviceName, deviceStatus);
      diskArray.disks.push(disk);
      lastIndentLevel = indentLevel;
      continue;
    }
    return i;
  };

  PoolParser.prototype.addDiskarray = function(name, type, status) {
    var diskArray;
    if (status == null) status = '';
    name = type === 'striped' ? "striped-" + (this.stripeIndex++) : name;
    diskArray = new Diskarray(name, type, status);
    this.pool.addDiskarray(diskArray);
    return diskArray;
  };

  return PoolParser;

})();

module.exports = exports = PoolParser;
