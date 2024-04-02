const bcrypt = require('bcrypt')
const saltRounds = 10

module.exports.encryptPassword = async (password) => 
    await bcrypt.hash(password, saltRounds).then(hash => hash)

module.exports.comparePassword = async (password, dbPassword) => 
    await  bcrypt.compare(password, dbPassword).then(response => response)
