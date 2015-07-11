var ProtoBuf = require('protobufjs')
var path = require('path')

var protopath = path.resolve(__dirname, 'paymentrequest.proto'),
    payments = ProtoBuf.loadProtoFile(protopath).build('payments')

module.exports = payments
