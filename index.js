var hyperlog = require('hyperlog')
var hyperdrive = require('hyperdrive')
var memdb = require('memdb')

var log = hyperlog(memdb())
var clone = hyperlog(memdb())

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

clone.createReadStream({live: true}).on('data', function (data) {
  console.log('change: (%d) %s, %s', data.change, data.key, data.value.toString())
})

var drive = hyperdrive(memdb())

commit('hello world', function (link) {
  log.add(null, link, function (err, node) {
    if (err) throw err
    commit('hello mars', function (link) {
      log.add(node, link, function (err, node) {
        if (err) throw err
        sync(log, clone)
        log.add(null, 'meh')
      })
    })
  })
})

function commit (text, cb) {
  var archive = drive.createArchive()
  var ws = archive.createFileWriteStream('hello.txt')
  ws.write(text)
  ws.end()
  archive.finalize(function () {
    var link = archive.key.toString('hex')
    cb(link)
  })
}
