var Comparator, exports;

Comparator = (function() {

  function Comparator(monitor, callBackContext) {
    this.monitor = monitor;
    this.callBackContext = callBackContext;
    this.missingType = 'missing';
    this.changeType = 'change';
    this.compareLeaves = false;
  }

  Comparator.prototype.compareSomethings = function(lhsSth, rhsSth, parentIds, sthType, next) {
    var lhs, _i, _len, _results;
    if (next == null) next = function() {};
    _results = [];
    for (_i = 0, _len = lhsSth.length; _i < _len; _i++) {
      lhs = lhsSth[_i];
      _results.push(this.compareSomething(lhs, rhsSth, parentIds.slice(), sthType, next));
    }
    return _results;
  };

  Comparator.prototype.compareSomething = function(lhs, rhsSth, parentIds, sthType, next) {
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
      return this.emitChange(lhs, this.missingType, parentIds, eventPrefixes);
    } else {
      if (this.compareLeaves && (lhs.equals != null) && !lhs.equals(nextRhs)) {
        this.emitChange(lhs, this.changeType, parentIds, eventPrefixes);
      }
      return next.call(this.callBackContext, lhs, nextRhs, eventPrefixes.slice(1));
    }
  };

  Comparator.prototype.getEventPrefixes = function(lhs, sthType) {
    var eventPrefixes;
    eventPrefixes = [];
    eventPrefixes.push([sthType, '*'].join(':'));
    eventPrefixes.push([sthType, lhs.id].join(':'));
    if ((lhs.name != null)) eventPrefixes.push([sthType, lhs.name].join(':'));
    return eventPrefixes;
  };

  Comparator.prototype.emitChange = function(lhs, changeType, parentIds, eventPrefixes) {
    var e, p, _i, _len, _results;
    if (parentIds == null) parentIds = [];
    if (eventPrefixes == null) eventPrefixes = null;
    if (eventPrefixes == null) {
      eventPrefixes = this.getEventPrefixes(lhs, changeType);
    }
    _results = [];
    for (_i = 0, _len = eventPrefixes.length; _i < _len; _i++) {
      e = eventPrefixes[_i];
      this.monitor._emit([e, changeType].join(':'), lhs);
      _results.push((function() {
        var _j, _len2, _results2;
        _results2 = [];
        for (_j = 0, _len2 = parentIds.length; _j < _len2; _j++) {
          p = parentIds[_j];
          _results2.push(this.monitor._emit([p, e, changeType].join(':'), lhs));
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };

  return Comparator;

})();

module.exports = exports = Comparator;
