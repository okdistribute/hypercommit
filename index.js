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

function CommitDrive (commits, link, opts) {
  if (!(this instanceof CommitDrive)) return new CommitDrive(commits, link, opts)
  var self = this
  self.commits = commits
  Archive.call(this, commits.drive, link, opts)
}

inherits(CommitDrive, Archive)

CommitDrive.prototype.commit = function (cb) {
  var self = this
  self.finalize(function (err) {
    if (err) return cb(err)
    var data = {
      link: self.key
    }
    self.commits.log.add(null, JSON.stringify(data), function (err) {
      if (err) return cb(err)
      cb(null, data)
    })
  })
}
