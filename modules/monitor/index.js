var Monitor, Query, exports,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Query = require('../query');

Monitor = (function() {

  function Monitor() {
    this.onQueryComplete = __bind(this.onQueryComplete, this);    this.lastStatus = null;
    this.interval = 0;
    this.query = new Query();
    this.query.on('complete', this.onQueryComplete);
  }

  Monitor.prototype.startMonitoring = function() {
    return this.interval = setInterval(function() {
      return query.execute();
    }, 2000);
  };

  Monitor.prototype.stopMonitoring = function() {
    if (this.interval) return clearInterval(this.interval);
  };

  Monitor.prototype.subscribeForPool = function(pool) {
    return this.query.addPool(pool);
  };

  Monitor.prototype.getSnapshot = function(cb) {
    if (this.lastStatus != null) return cb(this.lastStatus);
    this.query.once('complete', function(result) {
      return cb(result);
    });
    return this.query.execute();
  };

  Monitor.prototype.unsubscribeFromPool = function(pool) {
    this.query.removePool(pool);
    if (!(this.query.getNumberOfPools > 0)) return this.stopMonitoring;
  };

  Monitor.prototype.onQueryComplete = function(result) {
    this.analyseResult(result);
    return this.lastStatus = result;
  };

  Monitor.prototype.analyseResult = function(result) {};

  return Monitor;

})();

module.exports = exports = new Monitor();
