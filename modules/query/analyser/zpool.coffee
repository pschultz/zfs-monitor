poolStatusPattern = /^ state: (\S+)/
poolScanPattern   = /^  scan: (resilver|scrub) in progress/
diskArrayStartPattern = /^        NAME/

class ZpoolAnalyser
  constructor: (@pool) ->

  analyse: (@zpoolOutput) ->
    lines = @zpoolOutput

    for i in [0..lines.length - 1]
      line = lines[i]

      if poolStatusPattern.test line
        [ nil, @pool.status ] = poolStatusPattern.exec line
        continue

      if poolScanPattern.test line
        i = @parseScans lines, i
        continue

      if diskArrayStartPattern.test(line)
        i = @parseDiskarrays lines, i+2
        continue

    @pool

  parseScans: (lines, i) ->
    eta = 0
    progress = 0

    [ nil, type ] = poolScanPattern.exec line

    line = lines[++i]

    etaPattern = /(\d+)h(\d)+m to go/
    if etaPattern.test line
      [ nil, hours, minutes ] = etaPattern.exec line
      eta = hours * 3600 + minutes * 60

    line = lines[++i]

    progressPattern = /([\d.]+)% done/

    if progressPattern.test line
      [ nil, percent ] = progressPattern.exec line
      progress = percent / 100

    @pool.addScan {
      type: type
      eta: eta
      progress: progress
    }

    return i

  parseDiskarrays: (lines, i) ->
    linePattern = /^ +(\S+) *(\S+)?/
    specialDeviceNamePattern = /^((raidz\d|mirror|logs|spares|cache)\S*)/

    lastIndentLevel = Infinity

    diskArray = null
    for i in [i..lines.length - 1]
      line = lines[i]
      break if line.match /^\s*$/

      [ leadingSpaces ] = /^ +/.exec line
      indentLevel = leadingSpaces.length

      [ nil, deviceName, deviceStatus ] = linePattern.exec line
      deviceType = 'striped'

      isSpecialDevice = specialDeviceNamePattern.test deviceName
      if isSpecialDevice
        [ nil, deviceName, deviceType ] = specialDeviceNamePattern.exec deviceName
        diskArray = @addDiskarray deviceName, deviceType, deviceStatus
        lastIndentLevel = indentLevel
        continue

      if indentLevel < lastIndentLevel
        diskArray = @addDiskarray deviceName, deviceType, deviceStatus
        lastIndentLevel = indentLevel
        continue if diskArray.type isnt 'striped'

      disk = new Disk deviceName, deviceStatus
      diskArray.disks.push disk

      lastIndentLevel = indentLevel
      continue

    return i

  addDiskarray: (name, type, status = '') ->
    name = if type == 'striped' then '' else name
    diskArray = new Diskarray name, type, status

    @pool.addDiskarray diskArray
    diskArray

module.exports = exports = ZpoolAnalyser
