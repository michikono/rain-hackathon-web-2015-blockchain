var crypto = require('crypto')
var bitcoin = require('bitcoinjs-lib')
var HttpUtility = require('./http-utility')
var payments = require('./payments')
var paymentRequest = require('./payment-request')

module.exports = {
    Client: Client,
    Xpub: Xpub,
    Xprv: Xprv,
    XpubPass: XpubPass,
    PaymentRequest: paymentRequest,
    payments: payments,

    // Deprecated exports
    Xpriv: Xprv
}

/**
 * Creates a Chain Wallets API client.
 * @constructor
 */
function Client(c) {
    // For compatibility, support both "key" and "token"
    if (!c.apiTokenId && !c.keyId) {
        c.apiTokenId = "GUEST-TOKEN"
    }
    this.auth = {
        user: c.apiTokenId || c.keyId,
        pass: c.secretApiToken || c.keySecret
    }

    if (!c.url) {
        c.url = 'https://w.chain.com'
    }
    if (!c.apiVersion) {
        c.apiVersion = 'v3'
    }
    if (!c.timeout) {
        c.timeout = 10000; // 10 seconds
    }

    var baseurl = c.url + '/' + c.apiVersion
    this.api = new HttpUtility({
        url: baseurl,
        auth: this.auth,
        timeout: c.timeout
    })

    this.certChain = c.certChain
    this.certKey = c.certKey
    this.keyStore = new KeyStore()
}

Client.prototype.getWallet = function (id, cb) {
    this.api.get('/wallets/' + id, cb)
}

Client.prototype.getWalletBalance = function (id, cb) {
    this.api.get('/wallets/' + id + '/balance', cb)
}

Client.prototype.getWallets = function (cb) {
    this.api.get('/wallets', cb)
}

Client.prototype.getWalletActivity = function (id, cb) {
    this.api.get('/wallets/' + id + '/activity', cb)
}

Client.prototype.rotateWalletKey = function (walletID, args, cb) {
    this.api.post('/wallets/' + walletID + '/rotate', args, cb)
}

Client.prototype.getBucketActivity = function (id, cb) {
    this.api.get('/buckets/' + id + '/activity', cb)
}

Client.prototype.getBucketBalance = function (id, cb) {
    this.api.get('/buckets/' + id + '/balance', cb)
}

Client.prototype.getBuckets = function (walletID, cb) {
    this.api.get('/wallets/' + walletID + '/buckets', cb)
}

Client.prototype.createBucket = function (walletID, cb) {
    this.api.post('/wallets/' + walletID + '/buckets', {}, cb)
}

Client.prototype.getReceiver = function (id, cb) {
    this.api.get('/receivers/' + id, cb)
}

// createReceiver(bucketID, [args, ] callback)
Client.prototype.createReceiver = function (bucketID, args, cb) {
    if (typeof args === 'function') {
        cb = args
        args = {}
    }

    var self = this
    self.api.post('/buckets/' + bucketID + '/receivers', args, function (err, resp) {
        if (err) {
            return cb(err)
        }
        self.buildReceiver(resp, cb)
    })
}

Client.prototype.getReceiver = function (id, cb) {
    var self = this
    self.api.get('/receivers/' + id, function (err, resp) {
        if (err) {
            return cb(err)
        }
        self.buildReceiver(resp, cb)
    })
}

Client.prototype.buildReceiver = function (resp, cb) {
    var rec
    try {
        rec = new Receiver(resp, {
            certChain: this.certChain,
            certKey: this.certKey
        })
        this.verifyReceiver(rec)
    } catch (err) {
        return cb(err)
    }
    cb(null, rec)
}

Client.prototype.verifyReceiver = function (rec) {
    // Validate pubkey
    this.verifySigners(
        rec.receiver_address,
        rec.receiver_address_components.signers,
        rec.blockChain
    )

    // Verify output
    var pd = payments.PaymentDetails.decode(
        new Buffer(rec.payment_details_message, "hex"))
    if (pd.outputs.length !== 1) {
        throw new Error("payment details had too many outputs")
    }
    var addr = bitcoin.Address.fromBase58Check(rec.receiver_address)
    if (!addr.toOutputScript().toBuffer().equals(pd.outputs[0].script.toBuffer())) {
        throw new Error("payment details output did not match address")
    }
}

Client.prototype.verifySigners = function (addr, signers, blockChain) {
    var numClientKeys = 0,
        self = this
    signers.forEach(function (s) {
        if (s.entity === "client") {
            numClientKeys++
            var key = self.keyStore.get(s.xpub_hash)
            if (!key) {
                throw new Error("Could not find key matching xpub hash " + s.xpub_hash)
            }
            if (!key.canReceive) {
                throw new Error("key " + key.hash + " is not valid for receiving")
            }

            verifyPubkey(key.xpub, s.derivation_path, s.pubkey)
        }
    })

    if (numClientKeys < signers.length / 2) {
        throw new Error("do not have majority of keys for address: " + addr)
    }

    var pubkeys = signers.map(function (s) {
        return bitcoin.ECPubKey.fromHex(s.pubkey)
    })
    verifyP2SHAddr(addr, 2, pubkeys, blockChain)
}

function verifyPubkey(xpub, derivePath, pubkey) {
    derivePath.forEach(function (x) {
        xpub = xpub.derive(x)
    })
    if (xpub.pubKey.toHex() !== pubkey) {
        throw new Error("client pubkey did not match local xpub")
    }
}

function verifyP2SHAddr(addr, sigsRequired, pubkeys, blockChain) {
    var redeem = bitcoin.scripts.multisigOutput(sigsRequired, pubkeys)
    var addrCheck = new bitcoin.Address(redeem.getHash(), blockChain.scriptHash)
    if (addrCheck.toBase58Check() !== addr) {
        throw new Error("address did not match p2sh script")
    }
}

function Receiver(data, conf) {
    for (var k in data) {
        if (data.hasOwnProperty(k)) {
            this[k] = data[k]
        }
    }

    this.conf = conf
    this.blockChain = getBlockChain(data.block_chain)
}

Receiver.prototype.address = function () {
    return this.receiver_address
}

Receiver.prototype.paymentRequest = function () {
    var details = new Buffer(this.payment_details_message, "hex")
    var signer = crypto.Sign('RSA-SHA256')
    var pr = new payments.PaymentRequest({
        serialized_payment_details: details,
        pki_type: 'x509+sha256',
        pki_data: (new payments.X509Certificates(this.conf.certChain)).encode(),
        signature: ''
    })
    signer.update(pr.toBuffer())
    pr.signature = signer.sign(this.conf.certKey)
    return pr.toBuffer()
}

/**
 * Performs the following steps:
 * - Generate a transaction template using the Chain Wallets API. Equivalent to
 *   Client#buildTransactionTemplate()
 * - Sign the transaction template using the local key store. Equivalent to
 *   Client#signTransactionTemplate()
 * - Finalize the transaction using the Chain Wallets API. Equivalent to
 *   Client#finalizeTransactionTemplate()
 * @param {Object} buildParams - Specifies the inputs and outputs for the
 *        transaction. See Client#buildTransactionTemplate() for a complete
 *        description.
 * @param {function} cb - Returns a summary of the transaction submitted to the
 *        Bitcoin network, or an error.
 */
Client.prototype.transact = function (buildParams, cb) {
    var self = this
    self.buildTransactionTemplate({
        inputs: buildParams.inputs,
        outputs: buildParams.outputs,
        metadata: buildParams.metadata
    }, function (err, buildResp) {
        if (err) {
            return cb(err)
        }

        try {
            self.verifyBuildResponse(buildParams, buildResp)
            self.signTransactionTemplate(buildResp.template)
        } catch (err) {
            return cb(err, null)
        }
        self.finalizeTransactionTemplate(buildResp.template, cb)
    })
}

/**
 * WARNING: this method is currently being short
 * circuited as we are making changes to w.chain.com.
 * Verifies an API response from /wallets/transact/build against the specified
 * inputs/outputs and the local key store. If the response is not valid, an
 * error will be thrown.
 * @param {Object} buildParams - The parameters passed to
 *        Client#buildTransactionTemplate()
 * @param {Object} buildResp - The response from
 *        Client#buildTransactionTemplate()
 */
Client.prototype.verifyBuildResponse = function (buildParams, buildResp) {
    return
}

/**
 * Generates a transaction template using the Chain Wallets API
 * @param {Object} buildParams - Specifies the inputs and outputs for the
 *        transaction.
 * @param {Object[]} buildParams.inputs - A list of inputs and the amounts sent.
 * @param {string} buildParams.inputs[].bucket_id
 * @param {number} buildParams.inputs[].amount
 * @param {boolean} buildParams.inputs[].pays_fee - Whether the fee will be paid
 *        from this bucket. A transaction can only have a single fee payer.
 * @param {Object[]} buildParams.outputs - A list of outputs (either a bucket or
 *        and address) and the amounts received.
 * @param {string} buildParams.outputs[].bucket_id
 * @param {string} buildParams.outputs[].address
 * @param {number} buildParams.outputs[].amount
 * @param {boolean} buildParams.outputs[].pays_fee - Whether the fee will be
 *        paid from this bucket. A transaction can only have a single fee payer.
 * @param {function} cb - Returns a transaction template and verification
 *        metadata, or an error.
 */
Client.prototype.buildTransactionTemplate = function (buildParams, cb) {
    this.api.post('/wallets/transact/build', buildParams, cb)
}

/**
 * Signs a transaction template using the local key store.
 * @param {Object} template - A transaction template, returned by
 *        Client#buildTransactionTemplate()
 */
Client.prototype.signTransactionTemplate = function (template) {
    var tx = bitcoin.Transaction.fromHex(template.unsigned_hex)
    for (var i = 0; i < template.inputs.length; i++) {
        var inp = template.inputs[i]
        var sigs = inp.signatures

        for (var c = 0; c < sigs.length; c++) {
            var s = sigs[c],
                key = this.keyStore.get(s.xpub_hash)

            // sigs contains entries for multiple signers,
            // so we need to ignore any that we don't recognize
            // or are unable to sign
            if (!(key && key.canSign)) {
                continue
            }

            var xprv = key.xprv(s.xprv_encrypted),
                path = s.derivation_path
            for (var j = 0; j < path.length; j++) {
                xprv = xprv.derive(path[j])
            }

            var redeem = bitcoin.Script.fromHex(inp.redeem_script)
            var txSigHash = tx.hashForSignature(i, redeem, bitcoin.Transaction.SIGHASH_ALL)
            var sig = xprv.privKey.sign(txSigHash).toScriptSignature(bitcoin.Transaction.SIGHASH_ALL)
            s.signature = sig.toString('hex')
        }
    }
    return null
}

/**
 * Finalizes a transaction using the Chain Wallets API.
 * @param {Object} template - A transaction template, returned by
 *        Client#buildTransactionTemplate and signed by
 *        Client#signTransactionTemplate()
 */
Client.prototype.finalizeTransactionTemplate = function (signedTemplate, cb) {
    this.api.post('/wallets/transact/finalize', signedTemplate, cb)
}

/**
 * Open Assets
 */

Client.prototype.createAsset = function (id, opts, cb) {
    this.api.post('/wallets/' + id + "/assets", opts, cb)
}

Client.prototype.issueAsset = function (id, outputs, cb) {
    var self = this
    this.buildAssetIssuance(id, outputs, function (err, resp) {
        if (err) {
            cb(err, null)
            return
        }

        try {
            self.signTransactionTemplate(resp.template)
        } catch (err) {
            cb(err, null)
            return
        }
        self.finalizeTransactionTemplate(resp.template, cb)
    })
}

Client.prototype.buildAssetIssuance = function (id, outputs, cb) {
    this.api.post("/assets/" + id + "/issue", outputs, cb)
}

Client.prototype.transferAsset = function (inputs, outputs, cb) {
    var self = this
    this.buildAssetTransfer(inputs, outputs, function (err, resp) {
        if (err) {
            cb(err, null)
            return
        }

        try {
            self.signTransactionTemplate(resp.template)
        } catch (err) {
            cb(err, null)
            return
        }
        self.finalizeTransactionTemplate(resp.template, cb)
    })
}

Client.prototype.buildAssetTransfer = function (inputs, outputs, cb) {
    var body = {
        inputs: inputs,
        outputs: outputs
    }

    this.api.post("/assets/transfer", body, cb)
}

Client.prototype.getAsset = function (id, cb) {
    this.api.get("/assets/" + id, cb)
}

Client.prototype.getWalletAssets = function (id, cb) {
    this.api.get("/wallets/" + id + "/assets", cb)
}

Client.prototype.getWalletAssetBalance = function (id, cb) {
    this.api.get("/wallets/" + id + "/balance/assets", cb)
}

Client.prototype.getWalletAssetActivity = function () {
    var args = Array.prototype.slice.call(arguments)

    switch (args.length) {
    case 2:
        var id = args[0]
        var opts = {}
        var done = args[1]
        break

    case 3:
        var id = args[0]
        var opts = args[1]
        var done = args[2]
        break

    default:
        throw new Error('Invalid args: ' + args)
    }

    var headers = {}
    if (opts.nextPage) {
        headers['range-after'] = opts.nextPage
    }

    this.api.makeRequest({
        method: 'GET',
        path: '/wallets/' + id + '/activity/assets',
        headers: headers
    }, function (err, body, resp) {
        if (err) {
            return done(err)
        }

        var body = {
            items: body,
            nextPage: resp.headers['next-range-after']
        }

        done(null, body, resp)
    })
}

Client.prototype.getBucketAssetBalance = function (id, cb) {
    this.api.get("/buckets/" + id + "/balance/assets", cb)
}

Client.prototype.getBucketAssetActivity = function () {
    var args = Array.prototype.slice.call(arguments)

    switch (args.length) {
    case 2:
        var id = args[0]
        var opts = {}
        var done = args[1]
        break

    case 3:
        var id = args[0]
        var opts = args[1]
        var done = args[2]
        break

    default:
        throw new Error('Invalid args: ' + args)
    }

    var headers = {
        'range-after': opts.nextPage
    }

    this.api.makeRequest({
        method: 'GET',
        path: '/buckets/' + id + '/activity/assets',
        headers: headers
    }, function (err, body, resp) {
        if (err) {
            return done(err)
        }

        var body = {
            items: body,
            nextPage: resp.headers['next-range-after']
        }

        done(null, body, resp)
    })
}

function getBlockChain(name) {
    switch (name) {
    case 'bitcoin':
        return bitcoin.networks.bitcoin
    case 'testnet3':
        return bitcoin.networks.testnet
    }
    throw new Error("bad blockchain: " + name)
}

// A keyStore is a set of key objects.
// A key object may or may not be able to produce
// an xprv, and it may or may not need to be given
// the encrypted xprv to do so.
function KeyStore() {
    this.data = {}
}

KeyStore.prototype.add = function (k) {
    this.data[k.hash] = k
}

// Note: this dictionary is keyed on the xpub hash.
// This is the bitcoin-style hash160 function
// (RIPEMD(SHA256(x))) of the base58 encoding
// of the serialized xpub data.
KeyStore.prototype.get = function (xpubHash) {
    return this.data[xpubHash]
}

// Xprv takes a base58-encoded xprv and a boolean
// flag indicating whether it can be used to receive funds.
function Xprv(xprv, canRecv) {
    this.xprvObj = bitcoin.HDNode.fromBase58(xprv)
    this.xpub = this.xprvObj.neutered()
    this.hash = hashXpub(this.xpub.toBase58())
    this.canReceive = canRecv
    this.canSign = true
}

Xprv.prototype.xprv = function () {
    return this.xprvObj
}
Xprv.prototype.xpriv = Xprv.prototype.xprv; // deprecated

// Xpub takes a base58-encoded xpub and a boolean
// flag indicating whether it can be used to receive funds.
function Xpub(xpub, canRecv) {
    this.hash = hashXpub(xpub)
    this.xpub = bitcoin.HDNode.fromBase58(xpub)
    this.canReceive = canRecv
    this.canSign = false
}

Xpub.prototype.xprv = function () {
    throw new Error("xpub-only key cannot return xprv")
}
Xpub.prototype.xpriv = Xpub.prototype.xprv; // deprecated

// XpubPass takes a base58-encoded xpub,
// a passphrase used to decrypt the corresponding encrypted xprv,
// and a boolean flag indicating whether it can be used to receive funds.
function XpubPass(xpub, passphrase, canRecv) {
    this.hash = hashXpub(xpub)
    this.xpubBase58 = xpub
    this.xpub = bitcoin.HDNode.fromBase58(xpub)
    this.pass = passphrase
    this.canReceive = canRecv
    this.canSign = true
}

XpubPass.prototype.xprv = function (enc) {
    return decryptXprv(this.pass, this.xpubBase58, enc)
}
XpubPass.prototype.xpriv = XpubPass.prototype.xprv; // deprecated

function decryptXprv(passphrase, xpub, encryptedXPrv) {
    var key = crypto.pbkdf2Sync(passphrase, xpub, 100000, 16, 'sha256')

    encryptedXPrv = new Buffer(encryptedXPrv, "hex")
    var iv = encryptedXPrv.slice(0, 12)
    var cipherText = encryptedXPrv.slice(12, encryptedXPrv.length - 16)
    var authTag = encryptedXPrv.slice(encryptedXPrv.length - 16)

    var decipher = crypto.createDecipheriv('aes-128-gcm', key, iv)
    decipher.setAuthTag(authTag)

    var xprv = decipher.update(cipherText) + decipher.final()
    return bitcoin.HDNode.fromBase58(xprv)
}

function hashXpub(data) {
    return new Buffer(bitcoin.crypto.hash160(data)).toString("hex")
}
