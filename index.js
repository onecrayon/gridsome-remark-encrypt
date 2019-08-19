const AES = require('crypto-js/aes')
const unified = require('unified')
const remarkHtml = require('remark-html')
const moment = require('moment')

module.exports = function (options) {
	const keyName = options.keyName ? options.keyName : 'password'
	const contentPrefix = options.contentPrefix ? options.contentPrefix : 'ENCRYPTED:'

	return function (astTree, fileData) {
		if (!fileData.data.node[keyName] && (!fileData.data.node.fields || !fileData.data.node.fields[keyName])) return
		const now = moment()
		const publishDate = moment(new Date(fileData.data.node.date || fileData.data.node.fields.date))
		if (publishDate.isBefore(now)) return
		// Fetch our encryption key
		const key = fileData.data.node[keyName] || fileData.data.node.fields[keyName]
		// Encrypt our content and replace original content
		const plaintext = unified().use(remarkHtml).stringify(astTree, fileData)
		const encryptedContent = AES.encrypt(plaintext, key).toString()
		astTree.children = [{
			type: 'text',
			value: contentPrefix + encryptedContent
		}]
	}
}
