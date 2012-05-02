var Monitor, Query, events, exports, eyes,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

events = require('events');

eyes = require('eyes');

Query = require('../query');

Monitor = (function(_super) {

  __extends(Monitor, _super);

  function Monitor() {
    this._emit = __bind(this._emit, this);
    this.onQueryComplete = __bind(this.onQueryComplete, this);    this.lastStatus = null;
    this.interval = 0;
    this.query = new Query();
    this.query.on('complete', this.onQueryComplete);
  }

  Monitor.prototype.startMonitoring = function() {
    var self;
    self = this;
    return this.interval = setInterval(function() {
      return self.query.execute();
    }, 2000);
  };

  Monitor.prototype.stopMonitoring = function() {
    if (this.interval) return clearInterval(this.interval);
  };

  Monitor.prototype.getSnapshot = function(cb) {
    if (this.lastStatus != null) return cb(this.lastStatus);
    this.query.once('complete', function(result) {
      return cb(result);
    });
    return this.query.execute();
  };

  Monitor.prototype.onQueryComplete = function(result) {
    this.analyseResult(result);
    this.lastStatus = result;
    return this.emit('complete', result);
  };

  Monitor.prototype._emit = function() {
    var args;
    this.emit.apply(this, arguments);
    args = Array.prototype.slice.call(arguments);
    args.unshift('*');
    return this.emit.apply(this, args);
  };

  Monitor.prototype.analyseResult = function(result) {
    if (this.lastStatus == null) return;
    this.checkForMissingElements(result);
    return this.checkForAddedElements(result, function() {
      return this._emit('foo');
    });
  };

  Monitor.prototype.checkForMissingElements = function(result) {
    return this.diffPools(this.lastStatus.slice(1, 2), result.slice(1, 2), 'removed');
  };

  Monitor.prototype.checkForAddedElements = function(result, cb) {
    return this.diffPools(result.slice(1, 2), this.lastStatus.slice(1, 2), 'added', cb);
  };

  Monitor.prototype.diffPools = function(lhsPools, rhsPools, type, cb) {
    if (cb == null) cb = function() {};
    return this.diffSomething(lhsPools, rhsPools, 'pool', type, function(lhs, rhs) {
      this.diffSomething(lhs.filesystems, rhs.filesystems, 'zfs', type);
      return this.diffSomething(lhs.diskArrays, rhs.diskArrays, 'diskarray', type, function(lhs, rhs) {
        return this.diffSomething(lhs.disks, rhs.disks, 'disk', type);
      });
    });
  };

  Monitor.prototype.diffSomething = function(lhsSth, rhsSth, sthType, changeType, next) {
    var lhs, lhsChanged, nextRhs, rhs, _i, _j, _len, _len2, _results;
    if (next == null) next = function() {};
    _results = [];
    for (_i = 0, _len = lhsSth.length; _i < _len; _i++) {
      lhs = lhsSth[_i];
      lhsChanged = true;
      for (_j = 0, _len2 = rhsSth.length; _j < _len2; _j++) {
        rhs = rhsSth[_j];
        if (lhs.id === rhs.id) {
          nextRhs = rhs;
          lhsChanged = false;
        }
      }
      if (lhsChanged) {
        this._emit([sthType, lhs.id, changeType].join(':'), lhs);
        if ((lhs.name != null)) {
          this._emit([sthType, lhs.name, changeType].join(':'), lhs);
        }
        _results.push(this._emit([sthType, '*', changeType].join(':'), lhs));
      } else {
        _results.push(next.call(this, lhs, nextRhs));
      }
    }
    return _results;
  };

  return Monitor;

})(events.EventEmitter);

module.exports = exports = new Monitor();
