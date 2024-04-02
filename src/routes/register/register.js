const express = require("express")
const passManager = require('../../services/passwordManager')
const createWallet = require("../../utils/createWallet")
const Users = require("../../models/users")
const server = express()
server.use(express.json())

server.post('/register', async (req, res) =>{

    const { displayName, username, email, password } = req.body
    const encryptedPassword = await passManager.encryptPassword(password).then(hash => hash)

    const user = {
        displayName,
        username,
        email,
        password: encryptedPassword,
    }

    const foundUser = await Users.findOne({ username })
    await createWallet(foundUser, user, res)
});

module.exports = server
