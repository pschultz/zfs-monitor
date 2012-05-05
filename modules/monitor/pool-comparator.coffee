GenericComparator = require './generic-comparator'

class Comparator
  constructor: (@monitor) ->

  compare: (@leftResult, @rightResult)->
    @comparator = new GenericComparator @monitor, @
    @comparator.changeType = 'change'

    @comparator.missingType = 'removed'
    @comparator.compareLeaves = false
    @comparePools leftResult, rightResult

    @comparator.missingType = 'added'
    @comparator.compareLeaves = true
    @comparePools rightResult, leftResult

  comparePools: (lhsPools, rhsPools) ->

    @comparator.compareSomethings lhsPools,        rhsPools,        [],        'pool', @comparePoolContents

  comparePoolContents: (lhs, rhs, parentIds) ->
    @comparator.compareSomethings lhs.scans,       rhs.scans,       parentIds, 'scan'
    @comparator.compareSomethings lhs.filesystems, rhs.filesystems, parentIds, 'zfs'
    @comparator.compareSomethings lhs.diskArrays,  rhs.diskArrays,  parentIds, 'diskarray', @compareDiskarrayContents

  compareDiskarrayContents: (lhs, rhs, parentIds) ->
    @comparator.compareSomethings lhs.disks,       rhs.disks,       parentIds, 'disk'


module.exports = exports = Comparator
