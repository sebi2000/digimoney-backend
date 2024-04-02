const Wallet = require('../models/wallet')
const Users = require("../models/users")
const Currency = require('../models/currency')

const { initialAmount } = require('../constants/values')

const createWallet = async (foundUser, user, res) => {
    if(!foundUser) {
        try{
            const xUSD = await Currency.findOne({ 'name': 'xUSD' })
            const userCreated = await Users.create(user)
            const wallet = await Wallet.create({ 
                userId: userCreated._id,
                currency: [
                    {
                        currencyId: xUSD._id,
                        amount: Number(initialAmount)
                    }
                ]
            })
            res.status(200).json({
                message: "User successfully created",
                user: userCreated,
                wallet
            })
        }
        catch(err) {
            res.status(400).json({ err })
        }
    } else {
        res.status(401).json({
            message: "User not created",
        });
    }
}

const createUserAndWallet = async (user) => {
    const found = await Users.findOne({ _id: user.id });

    if (found) return null;

    try {
        const xUSD = await Currency.findOne({ 'name': 'xUSD' })
        const userCreated = await Users.create(user)
        
        const wallet = await Wallet.create({ 
            userId: userCreated._id,
            currency: [
                {
                    currencyId: xUSD._id,
                    amount: Number(initialAmount)
                }
            ]
        });

        return userCreated;
    } catch (err) {
        console.log("[ERROR] createWallet.js: createUserAndWallet: ", err);
    }
}

module.exports = createWallet
module.exports.createUserAndWallet = createUserAndWallet
