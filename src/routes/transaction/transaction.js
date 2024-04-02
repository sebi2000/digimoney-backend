const express = require('express')
const server = express()
const isAuth = require('../../middleware/isAuth')
const Wallet = require('../../models/wallet')
const Currency = require('../../models/currency')
const Transaction = require('../../models/transaction')
const { xUsdIndexWallet } = require('../../constants/values')

server.use(express.json())

server.post('/transaction', isAuth, async (req, res) => {
    const { amount, baseCurrencyName, exchangeCurrencyName } = req.body

    // Get user's wallet
    let wallet = await Wallet.findOne({ userId: req.session.passport.user._id })

    // Get the currencies we're working with
    const baseCurrency = await Currency.findOne({ name: baseCurrencyName })
    const exchangeCurrency = await Currency.findOne({ name: exchangeCurrencyName })

    const xUSD = await Currency.findOne({ name: 'xUSD' })

    const boughtCurrencyAmount = (amount * baseCurrency.ratio) / exchangeCurrency.ratio

    var baseCurrencyIndex = wallet.currency.findIndex(element => element.currencyId.equals(baseCurrency._id))
    var exchangeCurrencyIndex = wallet.currency.findIndex(element => element.currencyId.equals(exchangeCurrency._id))

    if (baseCurrencyIndex == -1 || wallet.currency[baseCurrencyIndex].amount < amount) {
        return res.status(400).json(
            {
                message: 'Insufficient funds in wallet for transaction',
            }
        );
    }

    if (!exchangeCurrency._id.equals(xUSD._id) && exchangeCurrency.exchangeAmount < boughtCurrencyAmount) {
        return res.status(400).json(
            {
                message: 'Insufficient amount for the exchanged currency',
            }
        );
    }

    //create currency in wallet if does not exist
    if (exchangeCurrencyIndex === -1) {
        await Wallet.updateOne(
            { _id: wallet._id },
            {
                $push: {
                    currency: {
                        currencyId: exchangeCurrency._id,
                        amount: 0
                    }
                }
            }
        );
        
        //get the index which is the last in array
        exchangeCurrencyIndex = wallet.currency.length
    }

    //get updated wallet
    wallet = await Wallet.findOne({ userId: req.session.passport.user._id })

    await Wallet.bulkWrite([
        {
            updateOne: {
                "filter": { _id: wallet._id, "currency.currencyId": baseCurrency._id },
                "update": { $set: { "currency.$.amount": wallet.currency[baseCurrencyIndex].amount - amount } }
            }
        },
        {
            updateOne: {
                "filter": { _id: wallet._id, "currency.currencyId": exchangeCurrency._id },
                "update": { $set: { "currency.$.amount": wallet.currency[exchangeCurrencyIndex].amount + boughtCurrencyAmount } }
            }
        }
    ]);

    await Currency.bulkWrite([
        {
            updateOne: {
                "filter": { _id: baseCurrency._id },
                "update": { $set: { exchangeAmount: baseCurrency.exchangeAmount + amount } }
            }
        },
        {
            updateOne: {
                "filter": { _id: exchangeCurrency._id },
                "update": { $set: { exchangeAmount: exchangeCurrency.exchangeAmount - boughtCurrencyAmount } }
            }
        }
    ])

    let currencyInWallet = await Wallet.findOne({ userId: req.session.passport.user._id })
    let cryptoInWallet = baseCurrency._id.equals(xUSD._id) 
        ? 
            wallet.currency[exchangeCurrencyIndex].amount + boughtCurrencyAmount
        : 
            wallet.currency[baseCurrencyIndex].amount - amount;
    
    const transaction = await Transaction.create({
        userId: req.session.passport.user._id,
        baseId: baseCurrency._id,
        exchangeId: exchangeCurrency._id,
        soldAmount: amount,
        boughAmount: boughtCurrencyAmount,
        cryptoInWallet,
        currencyInWallet: currencyInWallet.currency[xUsdIndexWallet].amount,
        transactionDate: new Date()
    })

    return res.status(200).send({
        message: "Successful transaction",
        transaction
    })

})

const response = []

const pushTransaction = async (transaction) => {
    let baseCurrency = await Currency.findById(transaction.baseId)
    let exchangeCurrency = await Currency.findById(transaction.exchangeId)

    const { soldAmount, boughAmount, cryptoInWallet, currencyInWallet, transactionDate } = transaction
    response.push({
        _id: transaction._id,
        sold: `${soldAmount} ${baseCurrency.name}`,
        bought: `${boughAmount} ${exchangeCurrency.name}`,
        cryptoInWallet,
        currencyInWallet,
        transactionDate: `${transactionDate.toLocaleDateString('en-UK')} ${transactionDate.toLocaleTimeString('en-US')}`,
    })
}

server.get('/transaction-history', isAuth, async (req, res) => {
    const transactions = await Transaction.find({ userId: req.session.passport.user._id })
    for (const transaction of transactions) {
        await pushTransaction(transaction)
    }
    return res.status(200).json({
        message: "Transactions were successfully retrieved",
        response
    })
})

module.exports = server
