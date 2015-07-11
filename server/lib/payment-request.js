var crypto = require('crypto')
var fs = require('fs')
var path = require('path')
var bitcoin = require('bitcoinjs-lib')
var asn = require('asn1.js/rfc/3280')
var payments = require('./payments')

var bundlepath = path.resolve(__dirname, 'ca-bundle.crt'),
    rootCertPEM = fs.readFileSync(bundlepath).toString(),
    pemReg = /\r?\n[^#\n].+?\r?\n=+\r?\n(.|\r?\n)+?-----END CERTIFICATE-----/g,
    certs = rootCertPEM.match(pemReg),
    rootCerts = {
        byName: {},
        byPEM: {}
    }

certs.forEach(function (cert) {
    cert = cert.split("\n")
    var name = cert[1]
    var pem = cert.slice(3).join("\n")

    rootCerts.byName[name] = pem
    rootCerts.byPEM[pem] = name
})

var rfcFieldNames = {
    "2.5.4.3": "commonName",
    "2.5.4.4": "surname",
    "2.5.4.5": "serialNumber",
    "2.5.4.6": "country",
    "2.5.4.7": "locality",
    "2.5.4.8": "state",
    "2.5.4.9": "streetAddress",
    "2.5.4.10": "organization",
    "2.5.4.11": "unit",
    "2.5.4.12": "title",
    "2.5.4.13": "description",
    "2.5.4.15": "businessCategory",
    "2.5.4.16": "postalAddress",
    "2.5.4.17": "postalCode",
    "2.5.4.18": "postOfficeBox",

    "1.3.6.1.4.1.311.60.2.1.3": "incorporationCountry",
    "1.3.6.1.4.1.311.60.2.1.2": "incorporationState"
}

var payments

function PaymentRequest(buffer) {
    this.message = payments.PaymentRequest.decode(buffer)
    this.paymentDetails = payments.PaymentDetails.decode(this.message.serialized_payment_details.toBuffer())

    var amountSum = this.paymentDetails.outputs.reduce(function (s, o) {
        return o.amount.add(s)
    }, 0)

    this.amount = amountSum
    this.memo = this.paymentDetails.memo
}

PaymentRequest.prototype.outputs = function () {
    var network
    if (this.paymentDetails.network === "main" || !this.paymentDetails.network) {
        network = bitcoin.networks.bitcoin
    } else {
        network = bitcoin.networks.testnet
    }
    return this.paymentDetails.outputs.map(function (o) {
        var script = bitcoin.Script.fromBuffer(o.script.toBuffer())
        return {
            address: bitcoin.Address.fromOutputScript(script, network).toString(),
            amount: o.amount
        }
    })
}

PaymentRequest.prototype.certInfo = function () {
    var certs = payments.X509Certificates.decode(this.message.pki_data.toBuffer())
    if (certs.certificate.length === 0) {
        return null
    }

    var data = asn.Certificate.decode(certs.certificate[0].toBuffer(), 'der')
    var info = {}
    data.tbsCertificate.subject.value.forEach(function (valueArr) {
        valueArr.forEach(function (v) {
            var fieldName = rfcFieldNames[v.type.join(".")]
            if (!fieldName) {
                return
            }

            if (info[fieldName] !== undefined) {
                info[fieldName] += "\n" + v.value.toString().slice(2)
            } else {
                info[fieldName] = v.value.toString().slice(2)
            }
        })
    })

    return info
}

PaymentRequest.prototype.hasValidSignature = function () {
    var hashType = sigHashType(this)
    if (hashType === 'none') {
        return false
    }
    var certs = payments.X509Certificates.decode(this.message.pki_data.toBuffer())
    var verifier = new crypto.Verify(hashType)
    var pem = DERtoPEM(certs.certificate[0].toBuffer())
    verifier.update(unsignedPRData(this.message))
    return verifier.verify(pem, this.message.signature.toBuffer())
}

PaymentRequest.prototype.hasValidCertChain = function () {
    var hashType = sigHashType(this)
    if (hashType === 'none') {
        return false
    }
    var certs = payments.X509Certificates.decode(this.message.pki_data.toBuffer())

    return certs.certificate.every(function (cert, c) {
        var pem = DERtoPEM(cert.toBuffer())

        if (rootCerts.byPEM[pem]) {
            return true
        }

        var data = asn.Certificate.decode(cert.toBuffer(), 'der')
        var ncert = certs.certificate[c + 1]
        if (ncert) {
            ncert = ncert.toBuffer()
        }

        if (!ncert) {
            var issuerName = getRFCField(data.tbsCertificate.issuer, "commonName")
            if (!issuerName) {
                return false
            }

            ncert = rootCerts.byName[issuerName]
            if (!ncert) {
                return false
            }
            ncert = PEMtoDER(ncert)
        }

        var nextData = asn.Certificate.decode(ncert, 'der')

        if (!validCertTime(data, nextData)) {
            return false
        }

        if (!validIssuer(data, nextData)) {
            return false
        }

        var sig = data.signature.data
        var signedData = getTBSCertificate(cert.toBuffer(), sig)
        var verifier = crypto.createVerify(hashType)
        verifier.update(signedData)
        return verifier.verify(DERtoPEM(ncert), sig)
    })
}

function validCertTime(cur, next) {
    var now = Date.now()
    return !(
        cur.tbsCertificate.validity.notBefore.value > now ||
        cur.tbsCertificate.validity.notAfter.value < now ||
        next.tbsCertificate.validity.notBefore.value > now ||
        next.tbsCertificate.validity.notAfter.value < now
    )
}

function validIssuer(cur, next) {
    var issuer = cur.tbsCertificate.issuer
    var subject = next.tbsCertificate.subject
    if (issuer.type !== subject.type) {
        return false
    }

    for (var i = 0; i < issuer.value.length; i++) {
        for (var j = 0; j < issuer.value[i].length; j++) {
            var iObj = issuer.value[i][j],
                sObj = subject.value[i][j]
            if (iObj.type.join(".") !== sObj.type.join(".")) {
                return false
            }

            if (iObj.value.toString('hex') !== sObj.value.toString('hex')) {
                return false
            }
        }
    }

    return true
}

function sigHashType(pr) {
    switch (pr.message.pki_type) {
    case 'x509+sha256':
        return 'RSA-SHA256'
    case 'x509+sha1':
        return 'RSA-SHA1'
    default:
        return 'none'
    }
}

function getRFCField(rfc, field) {
    for (var i = 0; i < rfc.value.length; i++) {
        if (rfcFieldNames[rfc.value[i][0].type.join(".")] === field) {
            return rfc.value[i][0].value.toString().slice(2)
        }
    }
}

function DERtoPEM(der) {
    var pem = "-----BEGIN CERTIFICATE-----\n"
    pem += der.toString('base64')
    pem = pem.replace(/(.{64})/g, "$1\n") // split into 64 char lines
    pem = pem.replace(/\n$/g, "") // clear potential trailing whitespace
    return new Buffer(pem + "\n-----END CERTIFICATE-----\n")
}

function PEMtoDER(pem) {
    var data = pem.toString().replace(/(-{5}\w+ \w+-{5}|\r?\n)/g, "")
    return new Buffer(data, "base64")
}

function unsignedPRData(pr) {
    var sig = pr.signature.toBuffer()
    pr.setSignature(new Buffer([]))
    var unsigned = pr.toBuffer()
    pr.setSignature(sig)
    return unsigned
}

function getTBSCertificate(data, sig) {
    // We start by slicing off the first SEQ of the
    // Certificate (TBSCertificate is its own SEQ).

    // The first 10 bytes usually look like:
    // [ 48, 130, 5, 32, 48, 130, 4, 8, 160, 3 ]
    var start = 0
    var starts = 0
    for (start = 0; start < data.length; start++) {
        if (starts === 1 && data[start] === 48) {
            break
        }
        if (starts < 1 && data[start] === 48) {
            starts++
        }
    }

    // The bytes *after* the TBS (including the last TBS byte) will look like
    // (note the 48 - the start of the sig, and the 122 - the end of the TBS):
    // [ 122, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, ... ]

    // The certificate in these examples has a `start` of 4, and an `end` of
    // 1040. The 4 bytes is the DER SEQ of the Certificate, right before the
    // SEQ of the TBSCertificate.
    var end = 0
    var ends = 0
    for (end = data.length - 1 - sig.length; end > 0; end--) {
        if (ends === 2 && data[end] === 48) {
            break
        }
        if (ends < 2 && data[end] === 0) {
            ends++
        }
    }

    // Return our raw DER TBSCertificate:
    return data.slice(start, end)
}

module.exports = PaymentRequest
