var Pool, PoolParser, Query, ZfsParser, cproc, events, exports, path,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

cproc = require('child_process');

path = require('path');

events = require('events');

Pool = require('../zpool');

PoolParser = require('./parser/zpool');

ZfsParser = require('./parser/zfs');

Query = (function(_super) {

  __extends(Query, _super);

  function Query() {
    this.poolsToQuery = [];
  }

  Query.prototype.addPool = function(name) {
    var i;
    if ((function() {
      var _i, _len, _ref, _results;
      _ref = this.poolsToQuery;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push(i === name);
      }
      return _results;
    }).call(this)) {
      return;
    }
    return this.poolsToQuery.push(name);
  };

  Query.prototype.removePool = function(name) {
    var i, pool, _len, _ref;
    _ref = this.poolsToQuery;
    for (i = 0, _len = _ref.length; i < _len; i++) {
      pool = _ref[i];
      if (pool === name) {
        delete this.poolsToQuery[i];
        return;
      }
    }
  };

  Query.prototype.execute = function() {
    var self;
    this.zpools = [];
    self = this;
    self.queryZpool(function() {
      return self.parseZpools(function() {
        return self.queryZfs(function() {
          return self.parseFilesystems(function() {
            return self.emit('complete', self.zpools);
          });
        });
      });
    });
    return null;
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

  Query.prototype.parseZpools = function(cb) {
    var line, lines, newPoolPattern, nil, poolLines, poolName, _i, _len, _ref;
    newPoolPattern = /^  +pool: (\S+)/;
    lines = this.zpoolStatusOutput.split("\n");
    poolLines = [];
    poolName = 'unnamed';
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      if (newPoolPattern.test(line)) {
        if (poolLines.length) this.parseZpool(poolName, poolLines);
        poolLines = [];
        _ref = newPoolPattern.exec(line), nil = _ref[0], poolName = _ref[1];
      }
      poolLines.push(line);
    }
    this.parseZpool(poolName, poolLines);
    return cb();
  };

  Query.prototype.parseZpool = function(poolName, lines) {
    var parser, pool;
    pool = new Pool(poolName);
    this.zpools.push(pool);
    parser = new PoolParser(pool);
    return parser.parse(lines);
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

  Query.prototype.parseFilesystems = function(cb) {
    var fsName, lastPoolName, line, lines, poolLines, poolName, _i, _len;
    lines = this.zfsStatusOutput.split("\n");
    lines.shift();
    poolLines = {};
    poolName = 'unnamed';
    lastPoolName = null;
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      fsName = line.split(/\s+/)[0];
      poolName = fsName.split('/')[0];
      if (!poolLines[poolName]) poolLines[poolName] = [];
      poolLines[poolName].push(line);
    }
    for (poolName in poolLines) {
      lines = poolLines[poolName];
      this.parseFilesystem(poolName, lines);
    }
    return cb();
  };

  Query.prototype.parseFilesystem = function(poolName, lines) {
    var parser, pool;
    pool = this.getPoolByName(poolName);
    if (pool == null) return;
    parser = new ZfsParser(pool);
    return parser.parse(lines);
  };

  Query.prototype.getPoolByName = function(name) {
    var pool, _i, _len, _ref;
    _ref = this.zpools;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pool = _ref[_i];
      if (pool.name === name) return pool;
    }
    return null;
  };

  return Query;

})(events.EventEmitter);

module.exports = exports = Query;
