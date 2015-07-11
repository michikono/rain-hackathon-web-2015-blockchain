# chain-wallets-node

The Official Node.js SDK for Chain's Wallet API

## Install

```bash
$ npm install chain-wallets-node
```

## Quick Start

```js
var chain = require('chain-wallets-node');
var c = new chain.Client({
  apiTokenId: 'your-api-token-id',
  secretApiToken: 'your-secret-api-token'
});
c.keyStore.add(new chain.Xprv(process.env.XPRV, true));
c.getWallet('4b01aff0-847e-4fef-8b1f-d7ad9e49bd0d', function(err, resp) {
  console.log('label=' + resp.label);
});
```

## Documentation

The Chain API Documentation is available at [https://chain.com/docs/v3/node](https://chain.com/docs/v3/node)

## Publishing Nodule Package

```bash
$ npm publish
$ git tag 0.0.X
$ git push origin master --tags
```

## SDK Development

Install some tools:

```bash
$ npm install -g js-beautify jshint
```

Run tests, lint, and format the code:

```bash
$ npm test
```

See <https://jslinterrors.com/>
for the meaning of error messages
produced by the lint command jshint.
