var assert = require('assert')
var chain = require('../index')
var nock = require('nock')

function nockHelper() {
    return nock('https://w.chain.com').defaultReplyHeaders({
        'Content-Type': 'application/json'
    })
}

describe('Wallet SDK', function () {

    beforeEach(function () {
        this.client = new chain.Client({
            keyId: 'example-key-id',
            keySecret: 'example-key-secret'
        })
        this.client.keyStore.add(new chain.Xprv(
            'xprv9s21ZrQH143K3a9bdf75XBrpiHiQT8Tr441BVKTw6532LrMnhSUUj2p9UmDfnn8ry1ZmbRvnUHVpbVrn9rpmRBKk1p2EGJtQRNU5KoFuJai',
            true
        ))
    })

    afterEach(function () {
        nock.cleanAll()
    })

    describe('createBucket', function () {
        it('returns a bucket on success', function (done) {
            var walletID = "68b7ac31-0fdc-441c-bb46-8cea196e54ef"
            nockHelper().post('/v3/wallets/' + walletID + '/buckets').reply(
                200,
                "{\"wallet_index\": [2, 0], \"bucket_id\": \"8f64d2cd-721e-491d-bf2d-4bca5b5c83c5\", \"block_chain\": \"bitcoin\"}"
            )

            this.client.createBucket(walletID, function (err, bucket) {
                if (err) {
                    throw err
                }

                assert(bucket.bucket_id)
                assert(bucket.wallet_index)
                assert(bucket.block_chain)

                done()
            })
        })
    })

    describe('getBucketActivity', function () {
        it('returns bucket activity on success', function (done) {
            var bucketID = "9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e"
            nockHelper().get('/v3/buckets/' + bucketID + '/activity').reply(
                200,
                "[{\"receiver_id\": \"e5d49f34-6389-47de-b12a-c75c527d6036\", \"timestamp\": \"2015-04-21T21:31:02.851Z\", \"amount\": 546, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"confirmations\": 2, \"type\": \"deposit\", \"transaction_id\": \"3c5c4034eb083109cf1b54e7466d75aea17cb250c2102e13ca8e830201627990\"}, {\"receiver_id\": \"422c5697-26c3-4d9d-9c0f-d6a2fd4b6886\", \"timestamp\": \"2015-04-21T20:36:24.158Z\", \"amount\": 546, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"confirmations\": 10, \"type\": \"deposit\", \"transaction_id\": \"e0873a1d0cb23f453d506660a227e04c967872b9d3903afcdd88f97c2f0595dc\"}, {\"receiver_id\": \"09064fa2-6dfe-46a3-a9af-8cdc1dc5513e\", \"timestamp\": \"2015-04-21T20:35:58.251Z\", \"amount\": 546, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"confirmations\": 10, \"type\": \"deposit\", \"transaction_id\": \"437baa0495f19183ea2cd1e2dddc4da66512b477cd0c68f1e37c1443918c5eb1\"}]"
            )

            this.client.getBucketActivity(bucketID, function (err, activity) {
                if (err) {
                    throw err
                }

                assert(activity.length > 0)
                assert(activity[0].receiver_id)
                assert(activity[0].amount > 0)

                done()
            })
        })
    })

    describe('getBucketBalance', function () {
        it('returns bucket balance on success', function (done) {
            var bucketID = "9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e"
            nockHelper().get('/v3/buckets/' + bucketID + '/balance').reply(
                200,
                "{\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"total\": {\"balance\": 1638, \"deposits\": 1638, \"withdrawals\": 0}, \"confirmed\": {\"balance\": 1638, \"deposits\": 1638, \"withdrawals\": 0}, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\"}"
            )

            this.client.getBucketBalance(bucketID, function (err, balance) {
                if (err) {
                    throw err
                }

                assert(balance.wallet_id)
                assert.equal(balance.bucket_id, bucketID)
                assert(balance.total.balance > 0)
                assert(balance.confirmed.balance > 0)

                done()
            })
        })
    })

    describe('createReceiver', function () {
        it('creates a receiver with no expiry given no extra args', function (done) {
            var bucketID = "9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e"
            nockHelper().post('/v3/buckets/' + bucketID + '/receivers').reply(
                200,
                "{\"receiver_id\": \"6abc5ed7-f0c2-48cf-b8b5-da95b94cf614\", \"block_chain\": \"bitcoin\", \"receiver_address_components\": {\"signatures_required\": 2, \"signers\": [{\"pubkey\": \"037c1417149518296c56eeb0e0a26b4a8971ccdb2773bc7033dd68b70b8548035e\", \"type\": \"co_signer\", \"entity\": \"chain\"}, {\"derivation_path\": [0, 0, 0, 3, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"pubkey\": \"03e837cb02abfbe9aff697e9566d36f05d1cfce3f17eca5b47c2a01ec039185e75\", \"entity\": \"client\"}]}, \"created\": \"2015-04-21T23:11:01.947226Z\", \"expires\": null, \"payment_request_message\": null, \"payment_details_message\": \"121b08001217a9149700f8edb313d0619b61190c2d48dec2531f7025871885b2dba9052a00\", \"receiver_address\": \"3FTT858kWbkb2LFDCZF7oD85tHbKdg1W9X\"}"
            )

            this.client.createReceiver(bucketID, function (err, receiver) {
                if (err) {
                    throw err
                }

                assert(receiver.receiver_id)
                assert(!receiver.expires)
                assert(receiver.receiver_address_components.signers.length > 0)

                done()
            })
        })

        it('creates a receiver given expiry and memo', function (done) {
            var bucketID = "9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e"
            nockHelper().post('/v3/buckets/' + bucketID + '/receivers').reply(
                200,
                "{\"receiver_id\": \"ec1960cf-764f-4034-95ae-4953c081ca80\", \"block_chain\": \"bitcoin\", \"receiver_address_components\": {\"signatures_required\": 2, \"signers\": [{\"pubkey\": \"0326f1fc85a6ff6b5831501fb6247b80fc21743b5562e681ac827d845d89246578\", \"type\": \"co_signer\", \"entity\": \"chain\"}, {\"derivation_path\": [0, 0, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"pubkey\": \"03587b6cf6bbfc79cb4ebf5cfd6be6fb57630a06784eabef0d476dbf715b5594d1\", \"entity\": \"client\"}]}, \"created\": \"2015-04-22T00:26:41.866113Z\", \"expires\": \"2015-04-25T23:20:13Z\", \"payment_request_message\": null, \"payment_details_message\": \"121c08e8071217a914d296e091653d05e4bb4a4fc1fee4ff7f736142a38718c1d5dba90520adc2f0a9052a114d656d6f20666f72207265636569766572\", \"receiver_address\": \"3LtWZxhHmE1ZUiRKbPGrNvqocK7SSruZzH\"}"
            )

            this.client.createReceiver(bucketID, {
                amount: 1000,
                expires: "2015-04-25T16:20:13-07:00",
                memo: "Memo for receiver"
            }, function (err, receiver) {
                if (err) {
                    throw err
                }

                assert(receiver.receiver_id)
                assert(receiver.expires)
                assert(receiver.receiver_address_components.signers.length > 0)

                done()
            })
        })
    })

    describe('getReceiver', function () {
        it('returns receiver on success', function (done) {
            var receiver_id = "ec1960cf-764f-4034-95ae-4953c081ca80"
            nockHelper().get('/v3/receivers/' + receiver_id).reply(
                200,
                "{\"receiver_id\": \"ec1960cf-764f-4034-95ae-4953c081ca80\", \"block_chain\": \"bitcoin\", \"receiver_address_components\": {\"signatures_required\": 2, \"signers\": [{\"pubkey\": \"0326f1fc85a6ff6b5831501fb6247b80fc21743b5562e681ac827d845d89246578\", \"type\": \"co_signer\", \"entity\": \"chain\"}, {\"derivation_path\": [0, 0, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"pubkey\": \"03587b6cf6bbfc79cb4ebf5cfd6be6fb57630a06784eabef0d476dbf715b5594d1\", \"entity\": \"client\"}]}, \"created\": \"2015-04-22T00:26:41.866113Z\", \"expires\": \"2015-04-25T23:20:13Z\", \"payment_request_message\": null, \"payment_details_message\": \"121c08e8071217a914d296e091653d05e4bb4a4fc1fee4ff7f736142a38718c1d5dba90520adc2f0a9052a114d656d6f20666f72207265636569766572\", \"receiver_address\": \"3LtWZxhHmE1ZUiRKbPGrNvqocK7SSruZzH\"}"
            )

            this.client.getReceiver(receiver_id, function (err, receiver) {
                if (err) {
                    throw err
                }

                assert.equal(receiver.receiver_id, receiver_id)
                assert(receiver.expires)
                assert(receiver.receiver_address_components.signers.length > 0)

                done()
            })
        })
    })

    describe('buildTransactionTemplate', function () {
        it('returns a transaction template and metadata', function (done) {
            nockHelper().post('/v3/wallets/transact/build').reply(
                200,
                "{\"change_addresses\": [{\"address_components\": [{\"derivation_path\": [0, 1, 0, 5, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"pubkey\": \"02d3fd38dd7598186c48539a37e14450fa9dde24cb662d797b98aed9f2f4a46423\", \"entity\": \"client\"}, {\"pubkey\": \"0313d3e01ab0341d50be5601e2b8b1415d4364807263e84e972229f637b6bccb84\", \"type\": \"co_signer\", \"entity\": \"chain\"}], \"signatures_required\": 2, \"address\": \"38wmLj11Eea2Kh6oCRWRyFe5BBXhafWS8m\"}], \"template\": {\"inputs\": [{\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [0, 1, 0, 1, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [757, 0, 0, 1, 0, 1, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52ae\"}, {\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [757, 0, 0, 1, 0, 4, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [0, 1, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52ae\"}], \"unsigned_hex\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e00100000017a914b09721c8bcbfe252c08d61a5877030dd253b7ff787ffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c482090000000017a914d1224fa47c8a8369fae795d0c5bef3042dba99e387ffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"block_chain\": \"bitcoin\"}}"
            )

            var buildParams = {
                inputs: [{
                    bucket_id: '95dad247-0ace-47d2-8dd3-b8766bcaaa54',
                    amount: 2000,
                    pays_fee: true
                }],
                outputs: [{
                    address: '3HnstCWtAVd88PcnbgjhgSjuS14vBKX2XX',
                    amount: 1000
                }, {
                    address: '3CdLXXHeBxsG7jZjpfGDr77S3x7x6KZ2F5',
                    amount: 1000
                }]
            }

            this.client.buildTransactionTemplate(buildParams, function (err, resp) {
                if (err) {
                    throw err
                }

                assert(resp.change_addresses.length > 0)
                assert(resp.template)
                assert(resp.template.unsigned_hex)
                assert(resp.template.block_chain)
                assert(resp.template.inputs.length > 0)

                done()
            })
        })
    })

    describe('signTransactionTemplate', function () {
        it('should add signatures to a transaction template', function () {
            var template = JSON.parse(
                "{\"inputs\": [{\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [0, 1, 0, 1, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [757, 0, 0, 1, 0, 1, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52ae\"}, {\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [757, 0, 0, 1, 0, 4, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [0, 1, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52ae\"}], \"unsigned_hex\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e00100000017a914b09721c8bcbfe252c08d61a5877030dd253b7ff787ffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c482090000000017a914d1224fa47c8a8369fae795d0c5bef3042dba99e387ffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"block_chain\": \"bitcoin\"}"
            )

            assert(template.inputs[0].signatures[0].signature.length === 0)
            this.client.signTransactionTemplate(template)
            assert(template.inputs[0].signatures[0].signature.length > 0)
        })
    })

    describe('finalizeTransactionTemplate', function () {
        it('should return a summary of the finalized transaction', function (done) {
            nockHelper().post('/v3/wallets/transact/finalize').reply(
                200,
                "{\"raw_transaction\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e001000000d90047304402201451be241009a2fc4f2279f8f87e79cc052c1e0f23bbc721dd33c1cdabe63ba60220747a6b1db4c85295339ff7c23fbd09c1980a7601c1db619cdca5ede0dac1b716014730440220596881ccdd3b2e6b12e2ed87838ec0cc765ddaeaded59576c95530edd1bb95190220759c6f523674a5bc7dedb1faa5f1c1afed15391574f5abc4d3c83f3b3f85a90701475221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52aeffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c4820900000000db00483045022100e16101d7fb20c7d39984381a68ce9ea0d2c8831dacb7542fba409189727e508302207e219516a151a282615db15a821a91000e1891161ae2d775322f67d11b56155f01483045022100a92d87676d987bda3a8829dba01e928298b65470bbad7bf2cec3558e21a37f3f022064948794bf08febb41d742a004461c21f174b2f9f968cc15ff899ce3527bf14301475221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52aeffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"transaction_id\": \"8cdefcb41a42495b9c723c4eba2dd8a7ba4dd431c661d86e03e241521d9f42c8\"}"
            )

            var template = JSON.parse(
                "{\"inputs\": [{\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [0, 1, 0, 1, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [757, 0, 0, 1, 0, 1, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52ae\"}, {\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [757, 0, 0, 1, 0, 4, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [0, 1, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52ae\"}], \"unsigned_hex\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e00100000017a914b09721c8bcbfe252c08d61a5877030dd253b7ff787ffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c482090000000017a914d1224fa47c8a8369fae795d0c5bef3042dba99e387ffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"block_chain\": \"bitcoin\"}"
            )

            this.client.signTransactionTemplate(template)
            this.client.finalizeTransactionTemplate(template, function (err, resp) {
                if (err) {
                    throw err
                }

                assert(resp.raw_transaction.length > 0)
                assert(resp.transaction_id.length > 0)

                done()
            })
        })
    })

    describe('transact', function () {
        it('returns transaction details on success', function (done) {
            nockHelper().post('/v3/wallets/transact/build').reply(
                200,
                "{\"change_addresses\": [{\"address_components\": [{\"derivation_path\": [0, 1, 0, 5, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"pubkey\": \"02d3fd38dd7598186c48539a37e14450fa9dde24cb662d797b98aed9f2f4a46423\", \"entity\": \"client\"}, {\"pubkey\": \"0313d3e01ab0341d50be5601e2b8b1415d4364807263e84e972229f637b6bccb84\", \"type\": \"co_signer\", \"entity\": \"chain\"}], \"signatures_required\": 2, \"address\": \"38wmLj11Eea2Kh6oCRWRyFe5BBXhafWS8m\"}], \"template\": {\"inputs\": [{\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [0, 1, 0, 1, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [757, 0, 0, 1, 0, 1, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52ae\"}, {\"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"signatures\": [{\"derivation_path\": [757, 0, 0, 1, 0, 4, 0], \"xpub_hash\": \"c7dcc933602bc808b990be37b18024fab516651d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}, {\"derivation_path\": [0, 1, 0, 4, 0, 0], \"xpub_hash\": \"3f6de0445dad18f5e1da8746db5450b42555375d\", \"signature\": \"\", \"xprv_encrypted\": \"\"}], \"redeem_script\": \"5221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52ae\"}], \"unsigned_hex\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e00100000017a914b09721c8bcbfe252c08d61a5877030dd253b7ff787ffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c482090000000017a914d1224fa47c8a8369fae795d0c5bef3042dba99e387ffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"block_chain\": \"bitcoin\"}}"
            ).post('/v3/wallets/transact/finalize').reply(
                200,
                "{\"raw_transaction\": \"0100000002dc95052f7cf988ddfc3a90d3b97278964ce027a26066503d453fb20c1d3a87e001000000d90047304402201451be241009a2fc4f2279f8f87e79cc052c1e0f23bbc721dd33c1cdabe63ba60220747a6b1db4c85295339ff7c23fbd09c1980a7601c1db619cdca5ede0dac1b716014730440220596881ccdd3b2e6b12e2ed87838ec0cc765ddaeaded59576c95530edd1bb95190220759c6f523674a5bc7dedb1faa5f1c1afed15391574f5abc4d3c83f3b3f85a90701475221027d85385697d23358bdb30f640177174144370d0bb13630ed3851c48feab0875e2103565ad23cdca652b695b81e15848d922a549c42cff90308824850d6bc8635b05f52aeffffffff06044a4cea9f9f01196faa7a22085c385604601b329b78ab35b2b78f79c4820900000000db00483045022100e16101d7fb20c7d39984381a68ce9ea0d2c8831dacb7542fba409189727e508302207e219516a151a282615db15a821a91000e1891161ae2d775322f67d11b56155f01483045022100a92d87676d987bda3a8829dba01e928298b65470bbad7bf2cec3558e21a37f3f022064948794bf08febb41d742a004461c21f174b2f9f968cc15ff899ce3527bf14301475221026c9ca0a2415c10c4b2cb3a335f0b4554bcf0fcf542244185a17bc5823954901c2103303523ddda472fec47bb4c94dcd63aa525fb0b3742e719e77ca51ceee9833dfb52aeffffffff03e80300000000000017a914b09dcbe7d144e5ebd416c913867ea5d17ea6219187e80300000000000017a91477f73fb4c96a7b666d023bae024288f9d816fd7b87667800000000000017a9144f92f25256627c83311cfc4f2ba5d7d3910288718700000000\", \"transaction_id\": \"8cdefcb41a42495b9c723c4eba2dd8a7ba4dd431c661d86e03e241521d9f42c8\"}"
            )

            var buildParams = {
                inputs: [{
                    bucket_id: '95dad247-0ace-47d2-8dd3-b8766bcaaa54',
                    amount: 2000,
                    pays_fee: true
                }],
                outputs: [{
                    address: '3HnstCWtAVd88PcnbgjhgSjuS14vBKX2XX',
                    amount: 1000
                }, {
                    address: '3CdLXXHeBxsG7jZjpfGDr77S3x7x6KZ2F5',
                    amount: 1000
                }]
            }

            this.client.transact(buildParams, function (err, resp) {
                if (err) {
                    throw err
                }

                assert(resp.raw_transaction.length > 0)
                assert(resp.transaction_id.length > 0)

                done()
            })
        })
    })

    describe('getWalletAssetActivity', function () {
        it('returns activiy items and a pagination cursor on success', function (done) {
            var self = this

            nockHelper().get('/v3/wallets/68b7ac31-0fdc-441c-bb46-8cea196e54ef/activity/assets').reply(
                200,
                "[{\"inputs\": [{\"amount\": 11092, \"addresses\": [\"34VgnqEsAD5t7oRBxr72JUa27U52wjHLcD\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"AKgYCXsAkTu5FeEpndjjrEeB4wALkMHcwc\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"AKgYCXsAkTu5FeEpndjjrEeB4wALkMHcwc\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353141, \"block_hash\": \"00000000000000000d3b52c387ab4ee7d3ddabc2954be95f50caea57d82f12eb\", \"block_time\": \"2015-04-21T21:50:49Z\", \"confirmations\": 11469, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 1812, \"transaction_id\": \"3c5c4034eb083109cf1b54e7466d75aea17cb250c2102e13ca8e830201627990\"}, {\"inputs\": [{\"amount\": 11092, \"addresses\": [\"33QTxr5dwrRDmdP3ytLauTT2o8avhBT2gm\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"AG14apDSUKaL3bku4jaocmWBcKzwCgUP2M\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"AG14apDSUKaL3bku4jaocmWBcKzwCgUP2M\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353133, \"block_hash\": \"00000000000000000b7efc9ff07d0f5ae4e7a2b37a458dfac4b129beb326cad8\", \"block_time\": \"2015-04-21T20:42:07Z\", \"confirmations\": 11477, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 436, \"transaction_id\": \"e0873a1d0cb23f453d506660a227e04c967872b9d3903afcdd88f97c2f0595dc\"}, {\"inputs\": [{\"amount\": 11092, \"addresses\": [\"3NANFNQbZGhZQ7VGsy6Vm1REEkfWLWZ3Aq\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"Acgu4KiFMWhhqxKRf2ftiiTxnLvf2v24Jd\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"Acgu4KiFMWhhqxKRf2ftiiTxnLvf2v24Jd\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353133, \"block_hash\": \"00000000000000000b7efc9ff07d0f5ae4e7a2b37a458dfac4b129beb326cad8\", \"block_time\": \"2015-04-21T20:42:07Z\", \"confirmations\": 11477, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 434, \"transaction_id\": \"437baa0495f19183ea2cd1e2dddc4da66512b477cd0c68f1e37c1443918c5eb1\"}]", {
                    'next-range-after': '68b7ac31-0fdc-441c-bb46-8cea196e54ef.353133.434'
                }
            ).get('/v3/wallets/68b7ac31-0fdc-441c-bb46-8cea196e54ef/activity/assets').matchHeader('range-after', '68b7ac31-0fdc-441c-bb46-8cea196e54ef.353133.434').reply(
                200,
                "[]"
            )

            self.client.getWalletAssetActivity('68b7ac31-0fdc-441c-bb46-8cea196e54ef', function (err, page) {
                if (err) {
                    throw err
                }

                assert(page.items.length > 0)

                self.client.getWalletAssetActivity('68b7ac31-0fdc-441c-bb46-8cea196e54ef', {
                    nextPage: page.nextPage
                }, function (err, page) {
                    if (err) {
                        throw err
                    }

                    assert(page.items.length === 0)

                    done()
                })
            })
        })
    })

    describe('getBucketAssetActivity', function () {
        it('returns activiy items and a pagination cursor on success', function (done) {
            var self = this

            nockHelper().get('/v3/buckets/95dad247-0ace-47d2-8dd3-b8766bcaaa54/activity/assets').reply(
                200,
                "[{\"inputs\": [{\"amount\": 11092, \"addresses\": [\"34VgnqEsAD5t7oRBxr72JUa27U52wjHLcD\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"AKgYCXsAkTu5FeEpndjjrEeB4wALkMHcwc\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"AKgYCXsAkTu5FeEpndjjrEeB4wALkMHcwc\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353141, \"block_hash\": \"00000000000000000d3b52c387ab4ee7d3ddabc2954be95f50caea57d82f12eb\", \"block_time\": \"2015-04-21T21:50:49Z\", \"confirmations\": 11469, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 1812, \"transaction_id\": \"3c5c4034eb083109cf1b54e7466d75aea17cb250c2102e13ca8e830201627990\"}, {\"inputs\": [{\"amount\": 11092, \"addresses\": [\"33QTxr5dwrRDmdP3ytLauTT2o8avhBT2gm\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"AG14apDSUKaL3bku4jaocmWBcKzwCgUP2M\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"AG14apDSUKaL3bku4jaocmWBcKzwCgUP2M\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353133, \"block_hash\": \"00000000000000000b7efc9ff07d0f5ae4e7a2b37a458dfac4b129beb326cad8\", \"block_time\": \"2015-04-21T20:42:07Z\", \"confirmations\": 11477, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 436, \"transaction_id\": \"e0873a1d0cb23f453d506660a227e04c967872b9d3903afcdd88f97c2f0595dc\"}, {\"inputs\": [{\"amount\": 11092, \"addresses\": [\"3NANFNQbZGhZQ7VGsy6Vm1REEkfWLWZ3Aq\"], \"asset_type\": \"bitcoin\"}], \"outputs\": [{\"asset_id\": \"Acgu4KiFMWhhqxKRf2ftiiTxnLvf2v24Jd\", \"amount\": 500, \"bucket_id\": \"95dad247-0ace-47d2-8dd3-b8766bcaaa54\", \"asset_type\": \"open_assets\"}, {\"asset_id\": \"Acgu4KiFMWhhqxKRf2ftiiTxnLvf2v24Jd\", \"amount\": 1000, \"bucket_id\": \"9f59e6cd-1c6f-47eb-bf2c-5b4f98d3073e\", \"asset_type\": \"open_assets\"}], \"block_height\": 353133, \"block_hash\": \"00000000000000000b7efc9ff07d0f5ae4e7a2b37a458dfac4b129beb326cad8\", \"block_time\": \"2015-04-21T20:42:07Z\", \"confirmations\": 11477, \"wallet_id\": \"68b7ac31-0fdc-441c-bb46-8cea196e54ef\", \"block_position\": 434, \"transaction_id\": \"437baa0495f19183ea2cd1e2dddc4da66512b477cd0c68f1e37c1443918c5eb1\"}]", {
                    'next-range-after': '68b7ac31-0fdc-441c-bb46-8cea196e54ef.353133.434'
                }
            ).get('/v3/buckets/95dad247-0ace-47d2-8dd3-b8766bcaaa54/activity/assets').matchHeader('range-after', '68b7ac31-0fdc-441c-bb46-8cea196e54ef.353133.434').reply(
                200,
                "[]"
            )

            self.client.getBucketAssetActivity('95dad247-0ace-47d2-8dd3-b8766bcaaa54', function (err, page) {
                if (err) {
                    throw err
                }

                assert(page.items.length > 0)

                self.client.getBucketAssetActivity('95dad247-0ace-47d2-8dd3-b8766bcaaa54', {
                    nextPage: page.nextPage
                }, function (err, page) {
                    if (err) {
                        throw err
                    }

                    assert(page.items.length === 0)

                    done()
                })
            })
        })
    })

})
