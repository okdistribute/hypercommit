var hyperlog = require('hyperlog')
var inherits = require('inherits')
var hyperdrive = require('hyperdrive')
var Archive = require('hyperdrive/archive')

module.exports = HyperCommit

function HyperCommit (db) {
  if (!(this instanceof HyperCommit)) return new HyperCommit(db)
  this.log = hyperlog(db)
  this.drive = hyperdrive(db)
}

HyperCommit.prototype.createVersion = function (link, opts) {
  return new CommitDrive(this, link, opts)
}

HyperCommit.prototype.createReadStream = function () {
  return this.log.createReadStream.apply(this.log, arguments)
}

HyperCommit.prototype.createReplicationStream = function () {
  return this.log.createReplicationStream.apply(this.log, arguments)
}

HyperCommit.prototype._add = function (node, data, cb) {
  this.log.add(node, data, cb)
}

function CommitDrive (commits, link, opts) {
  if (!(this instanceof CommitDrive)) return new CommitDrive(commits, link, opts)
  var self = this
  self.commits = commits
  Archive.call(this, commits.drive, link, opts)
}

inherits(CommitDrive, Archive)

CommitDrive.prototype.commit = function (node, cb) {
  var self = this
  if (typeof node === 'function') {
    cb = node
    node = null
  }
  self.finalize(function (err) {
    if (err) return cb(err)
    var data = {
      link: self.key.toString()
    }
    self.commits._add(node, JSON.stringify(data), function (err, node) {
      if (err) return cb(err)
      cb(null, node)
    })
  })
}
