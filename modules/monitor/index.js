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
    return this.diffPools(this.lastStatus.slice(1, 2), result.slice(1, 2), 'removed', true);
  };

  Monitor.prototype.checkForAddedElements = function(result) {
    return this.diffPools(result.slice(1, 2), this.lastStatus.slice(1, 2), 'added', false);
  };

  Monitor.prototype.diffPools = function(lhsPools, rhsPools, type, compareLeaves) {
    return this.diffSomethings(lhsPools, rhsPools, [], 'pool', type, compareLeaves, function(lhs, rhs, parentIds) {
      var poolParent;
      poolParent = parentIds;
      this.diffSomethings(lhs.scans, rhs.scans, parentIds, 'scan', type, compareLeaves);
      this.diffSomethings(lhs.filesystems, rhs.filesystems, parentIds, 'zfs', type, compareLeaves, function(lhs, rhs, parentIds) {});
      return this.diffSomethings(lhs.diskArrays, rhs.diskArrays, parentIds, 'diskarray', type, compareLeaves, function(lhs, rhs, parentIds) {
        return this.diffSomethings(lhs.disks, rhs.disks, parentIds, 'disk', type, compareLeaves, function(lhs, rhs) {});
      });
    });
  };

  Monitor.prototype.diffSomethings = function(lhsSth, rhsSth, parentIds, sthType, changeType, compareLeaves, next) {
    var lhs, _i, _len, _results;
    if (next == null) next = function() {};
    _results = [];
    for (_i = 0, _len = lhsSth.length; _i < _len; _i++) {
      lhs = lhsSth[_i];
      _results.push(this.diffSomething(lhs, rhsSth, parentIds.slice(), sthType, changeType, compareLeaves, next));
    }
    return _results;
  };

  Monitor.prototype.diffSomething = function(lhs, rhsSth, parentIds, sthType, changeType, compareLeaves, next) {
    var eventPrefixes, lhsChanged, nextRhs, rhs, _i, _len;
    if (next == null) next = function() {};
    lhsChanged = true;
    for (_i = 0, _len = rhsSth.length; _i < _len; _i++) {
      rhs = rhsSth[_i];
      if (lhs.id === rhs.id) {
        nextRhs = rhs;
        lhsChanged = false;
      }
    }
    eventPrefixes = this.getEventPrefixes(lhs, sthType);
    if (lhsChanged) {
      return this.emitChange(lhs, changeType, parentIds, eventPrefixes);
    } else {
      if (compareLeaves && (lhs.equals != null) && !lhs.equals(nextRhs)) {
        this.emitChange(lhs, 'change', parentIds, eventPrefixes);
      }
      return next.call(this, lhs, nextRhs, eventPrefixes.slice(1));
    }
  };

  Monitor.prototype.getEventPrefixes = function(lhs, sthType) {
    var eventPrefixes;
    eventPrefixes = [];
    eventPrefixes.push([sthType, '*'].join(':'));
    eventPrefixes.push([sthType, lhs.id].join(':'));
    if ((lhs.name != null)) eventPrefixes.push([sthType, lhs.name].join(':'));
    return eventPrefixes;
  };

  Monitor.prototype.emitChange = function(lhs, changeType, parentIds, eventPrefixes) {
    var e, p, _i, _len, _results;
    if (parentIds == null) parentIds = [];
    if (eventPrefixes == null) eventPrefixes = null;
    if (eventPrefixes == null) {
      eventPrefixes = this.getEventPrefixes(lhs, changeType);
    }
    _results = [];
    for (_i = 0, _len = eventPrefixes.length; _i < _len; _i++) {
      e = eventPrefixes[_i];
      this._emit([e, changeType].join(':'), lhs);
      _results.push((function() {
        var _j, _len2, _results2;
        _results2 = [];
        for (_j = 0, _len2 = parentIds.length; _j < _len2; _j++) {
          p = parentIds[_j];
          _results2.push(this._emit([p, e, changeType].join(':'), lhs));
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };

  return Monitor;

})(events.EventEmitter);

module.exports = exports = new Monitor();
