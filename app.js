var Monitor, eyes;

eyes = require('eyes');

Monitor = require('./modules/monitor');

Monitor.subscribeForPool('tank');

Monitor.getSnapshot(function(result) {
  var r, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = result.length; _i < _len; _i++) {
    r = result[_i];
    _results.push(eyes.inspect(r));
  }
  return _results;
});

Monitor.unsubscribeFromPool('tank');
