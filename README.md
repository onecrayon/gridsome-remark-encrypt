# gridsome-remark-encrypt

This is a plugin for the `@gridsome/transformer-remark` that encrypts parsed Markdown content. This allows simple "security lite" password protection for content on your static site, and is **probably not something you want or need.** I only published this because Remark plug-ins have to be installed from NPM or use absolute URLs in order to resolve; it's usage is pretty specific to my project and requires a fair bit of logic in your Vue files to leverage.

## Install

- `yarn add gridsome-remark-encrypt`
- `npm install gridsome-remark-encrypt`

## Usage

```js
module.exports = {
  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        remark: {
          plugins: [
            ['gridsome-remark-encrypt', {
              keyName: 'password', contentPrefix: 'ENCRYPTED:'}
            ]
          ]
        }
      }
    }
  ]
}
```

(If you wish to use the default options (shown above) you can just pass a string instead of an array.)

Content will be encrypted if both of these criteria are true:

* There is a key defined (see below)
* The defined `date` is in the future (when the site is built)

This allows you to set an expiration date after which the content will not be encrypted.

There are a few things to note when using this plug-in:

1. **You must never fetch the `password` meta value via GraphQL.** If you do, it will be included in your exported site. To check if your content is encrypted, you should do something like `node.content.startsWith('ENCRYPTED:')`.
2. **You will need to decrypt the data yourself client-side.** For instance, install `crypto-js` as a dependency, then use the following:
    
        import CryptoJS from 'crypto-js'
        // Assuming we've had the user enter the password stored in `let key`
        // and the content has been stored in `const encryptedContent`
        const decryptedContent = CryptoJS.AES.decrypt(encryptedContent, key).toString(
            CryptoJS.enc.Utf8
        )
        // Output like `<div v-html="decryptedContent"></div>`
3. **This isn't terribly secure.** Don't count on this to encrypt information that could do harm if it were decrypted (it's particularly straight-forward to brute-force, since an attacker would merely have to grab the encrypted string and then brute-force it locally at their leisure).

If you need a boolean to detect if your data is encrypted, try adding this to your `gridsome.server.js` file:

    const typeName = 'YOUR_CONTENT_TYPE_HERE'
    const compileDate = new Date()
    // Extend our `typeName` type with a field that checks if a post is encrypted
    api.loadSource(store => {
        const allPosts = store.getContentType(typeName)
        allPosts.addSchemaField('isEncrypted', ({ graphql }) => ({
            type: graphql.GraphQLBoolean,
            resolve (node) {
                // We can't check `node.content.startsWith('ENCRYPTED:')` because the content may
                // not have been encrypted yet
                return !!node.password && compileDate < new Date(node.date)
            }
        }))
    })

## Options

#### keyName

- Type: `string`

The camelCase name of the metadata key you want to be used to encrypt the content. Defaults to `password`, so something like this will result in encrypted content:

```markdown
---
password: someStringOrOther
---

This content will be encrypted.
```

#### contentPrefix

- Type: `string`

The string that will be prefixed to your encrypted content in order to allow easy conditional checks for encrypted content. Defaults to `ENCRYPTED:` so by default after the plugin runs your GraphQL `content` field will look something like this:

`ENCRYPTED:encrypted_content_here`
