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
    return this.checkForAddedElements(result);
  };

  Monitor.prototype.checkForMissingElements = function(result) {
    return this.diffPools(this.lastStatus.slice(3, 4), result.slice(3, 4), 'removed');
  };

  Monitor.prototype.checkForAddedElements = function(result) {
    return this.diffPools(result.slice(3, 4), this.lastStatus.slice(3, 4), 'added');
  };

  Monitor.prototype.diffPools = function(lhsPools, rhsPools, type) {
    return this.diffSomethings(lhsPools, rhsPools, [], 'pool', type, function(lhs, rhs, parentIds) {
      this.diffSomethings(lhs.scans, rhs.scans, parentIds, 'scan', type);
      this.diffSomethings(lhs.filesystems, rhs.filesystems, parentIds, 'zfs', type);
      return this.diffSomethings(lhs.diskArrays, rhs.diskArrays, parentIds, 'diskarray', type, function(lhs, rhs, parentIds) {
        return this.diffSomethings(lhs.disks, rhs.disks, parentIds, 'disk', type);
      });
    });
  };

  Monitor.prototype.diffSomethings = function(lhsSth, rhsSth, parentIds, sthType, changeType, next) {
    var lhs, _i, _len, _results;
    if (next == null) next = function() {};
    _results = [];
    for (_i = 0, _len = lhsSth.length; _i < _len; _i++) {
      lhs = lhsSth[_i];
      _results.push(this.diffSomething(lhs, rhsSth, parentIds.slice(), sthType, changeType, next));
    }
    return _results;
  };

  Monitor.prototype.diffSomething = function(lhs, rhsSth, parentIds, sthType, changeType, next) {
    var e, eventPrefixes, lhsChanged, nextRhs, p, rhs, _i, _j, _len, _len2, _results;
    if (next == null) next = function() {};
    lhsChanged = true;
    for (_i = 0, _len = rhsSth.length; _i < _len; _i++) {
      rhs = rhsSth[_i];
      if (lhs.id === rhs.id) {
        nextRhs = rhs;
        lhsChanged = false;
      }
    }
    eventPrefixes = [];
    eventPrefixes.push([sthType, '*'].join(':'));
    eventPrefixes.push([sthType, lhs.id].join(':'));
    if ((lhs.name != null)) eventPrefixes.push([sthType, lhs.name].join(':'));
    if (lhsChanged) {
      _results = [];
      for (_j = 0, _len2 = eventPrefixes.length; _j < _len2; _j++) {
        e = eventPrefixes[_j];
        this._emit([e, changeType].join(':'), lhs);
        _results.push((function() {
          var _k, _len3, _results2;
          _results2 = [];
          for (_k = 0, _len3 = parentIds.length; _k < _len3; _k++) {
            p = parentIds[_k];
            _results2.push(this._emit([p, e, changeType].join(':'), lhs));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    } else {
      return next.call(this, lhs, nextRhs, eventPrefixes.slice(1));
    }
  };

  return Monitor;

})(events.EventEmitter);

module.exports = exports = new Monitor();
