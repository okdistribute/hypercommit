var hypercommit = require('./')
var memdb = require('memdb')
var test = require('tape')

test('add files', function (t) {
  var commits = hypercommit(memdb())
  var version = commits.createVersion() // hyperdrive archive
  var ws = version.createFileWriteStream('hello.txt')
  ws.write('hello world')
  ws.end()
  version.commit(function (err, node) {
    t.error(err)
    var data = JSON.parse(node.value.toString())
    t.same(data.link.length, 32)
    t.end()
  })
})

test('replication', function (t) {
  var commits = hypercommit(memdb())
  var clone = hypercommit(memdb())

  var version = commits.createVersion()
  var ws = version.createFileWriteStream('hello.txt')
  ws.write('hello world')
  ws.end()
  var link
  version.commit(function (err, node) {
    t.error(err)
    var data = JSON.parse(node.value.toString())
    link = data.link
    t.same(data.link.length, 32)
    sync(commits, clone)
  })
  clone.createReadStream({live: true}).on('data', function (data) {
    t.same(data.change, 1)
    var json = JSON.parse(data.value.toString())
    t.same(link, json.link)
    t.end()
  })
})

var sync = function (a, b) {
  a = a.createReplicationStream({mode: 'push'})
  b = b.createReplicationStream({mode: 'pull'})

  a.on('push', function () {
    console.log('a pushed')
  })

  a.on('pull', function () {
    console.log('a pulled')
  })

  a.on('end', function () {
    console.log('a ended')
  })

  b.on('push', function () {
    console.log('b pushed')
  })

  b.on('pull', function () {
    console.log('b pulled')
  })

  b.on('end', function () {
    console.log('b ended')
  })

  a.pipe(b).pipe(a)
}
