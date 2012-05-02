var Disk, Diskarray, Filesystem, Pool, Query, cproc, events, exports, lastRun, normalizeBytes, path, running,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

cproc = require('child_process');

path = require('path');

events = require('events');

running = false;

lastRun = 0;

Pool = require('./pool');

Disk = require('./disk');

Diskarray = require('./array');

Filesystem = require('./filesystem');

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

Query = (function(_super) {

  __extends(Query, _super);

  Query.prototype.zpoolStatusOutput = "";

  Query.prototype.spinningTreshold = [60000, 300000];

  Query.prototype.zpool = null;

  Query.prototype.zfs = null;

  Query.prototype.deferTimer = 0;

  Query.prototype.slowDown = function() {
    return this.spinningTreshold[0] = 60000;
  };

  Query.prototype.keepItComin = function() {
    return this.spinningTreshold[0] = 2000;
  };

  Query.prototype.lastAnalysis = {};

  Query.prototype.newAnalysis = {};

  function Query() {
    var self;
    this.slowDown();
    self = this;
    setInterval(function() {
      return self.killStalledProcesses();
    }, 5000);
    this.on('analyzed', function() {
      return self.start();
    });
  }

  Query.prototype.start = function() {
    var deferFor, now, self, startedToFast, timeSinceLastRun;
    now = new Date().getTime();
    timeSinceLastRun = now - lastRun;
    self = this;
    startedToFast = timeSinceLastRun < this.spinningTreshold[0];
    if (startedToFast) {
      if (this.deferTimer === 0) {
        deferFor = this.spinningTreshold[0] - timeSinceLastRun;
        console.log("defering zpool queries for " + deferFor + " ms");
        this.deferTimer = setTimeout(function() {
          self.deferTimer = 0;
          return self.start();
        }, deferFor);
      }
      return;
    }
    running = true;
    lastRun = now;
    return this.doQuery();
  };

  Query.prototype.killStalledProcesses = function() {
    var now, timeSinceLastRun;
    if (!running) return;
    if (!((this.zpool != null) || (this.zfs != null))) return;
    now = new Date().getTime();
    timeSinceLastRun = now - lastRun;
    if (timeSinceLastRun > this.spinningTreshold[1]) {
      console.log('zpool or zfs did not respond in time, killing them now');
      this.emit('stalled');
      if (this.zpool != null) this.zpool.kill();
      if (this.zfs != null) return this.zfs.kill();
    }
  };

  Query.prototype.doQuery = function() {
    var self;
    self = this;
    this.newAnalysis = {};
    this.queryZpool(function() {
      return self.analyseZpool();
    });
    return this.queryZfs(function() {
      return self.analyseZfs();
    });
  };

  Query.prototype.queryZpool = function(cb) {
    var env, self;
    env = process.env;
    env.PATH += ":" + path.normalize(path.join(__dirname, '../../zfsmock'));
    this.zpool = cproc.spawn('zpool', ['status'], {
      env: env
    });
    this.zpoolStatusOutput = "";
    self = this;
    this.zpool.stdout.setEncoding('utf8');
    this.zpool.stderr.pipe(process.stderr);
    this.zpool.stdout.on('data', function(chunk) {
      return self.zpoolStatusOutput += chunk;
    });
    return this.zpool.on('exit', function(code) {
      if (code === 0) {
        self.zpool = null;
        return cb();
      } else {
        return self.query();
      }
    });
  };

  Query.prototype.queryZfs = function(cb) {
    var env, self;
    env = process.env;
    env.PATH += ":" + path.normalize(path.join(__dirname, '../../zfsmock'));
    this.zfs = cproc.spawn('zfs', ['list', '-o', 'name,used,available,refer,usedbysnapshots'], {
      env: env
    });
    this.zfsStatusOutput = "";
    self = this;
    this.zfs.stdout.setEncoding('utf8');
    this.zfs.stderr.pipe(process.stderr);
    this.zfs.stdout.on('data', function(chunk) {
      return self.zfsStatusOutput += chunk;
    });
    return this.zfs.on('exit', function(code) {
      if (code === 0) {
        self.zfs = null;
        return cb();
      } else {
        return self.query();
      }
    });
  };

  Query.prototype.analyseZfs = function() {};

  Query.prototype.getPoolByName = function(name) {
    var pool, _i, _len, _ref;
    _ref = this.newAnalysis.pools;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pool = _ref[_i];
      if (pool.name === name) return pool;
    }
  };

  return Query;

})(events.EventEmitter);

module.exports = exports = Query;
