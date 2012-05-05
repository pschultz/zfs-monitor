var Comparator, GenericComparator, exports;

GenericComparator = require('./generic-comparator');

Comparator = (function() {

  function Comparator(monitor) {
    this.monitor = monitor;
  }

  Comparator.prototype.compare = function(leftResult, rightResult) {
    this.leftResult = leftResult;
    this.rightResult = rightResult;
    this.comparator = new GenericComparator(this.monitor, this);
    this.comparator.changeType = 'change';
    this.comparator.missingType = 'removed';
    this.comparator.compareLeaves = false;
    this.comparePools(leftResult, rightResult);
    this.comparator.missingType = 'added';
    this.comparator.compareLeaves = true;
    return this.comparePools(rightResult, leftResult);
  };

  Comparator.prototype.comparePools = function(lhsPools, rhsPools) {
    return this.comparator.compareSomethings(lhsPools, rhsPools, [], 'pool', this.comparePoolContents);
  };

  Comparator.prototype.comparePoolContents = function(lhs, rhs, parentIds) {
    this.comparator.compareSomethings(lhs.scans, rhs.scans, parentIds, 'scan');
    this.comparator.compareSomethings(lhs.filesystems, rhs.filesystems, parentIds, 'zfs');
    return this.comparator.compareSomethings(lhs.diskArrays, rhs.diskArrays, parentIds, 'diskarray', this.compareDiskarrayContents);
  };

  Comparator.prototype.compareDiskarrayContents = function(lhs, rhs, parentIds) {
    return this.comparator.compareSomethings(lhs.disks, rhs.disks, parentIds, 'disk');
  };

  return Comparator;

})();

module.exports = exports = Comparator;
