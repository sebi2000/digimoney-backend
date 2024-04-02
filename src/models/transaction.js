const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },

    baseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency'
    },

    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency'
    },

    soldAmount: {
        type: Number,
        required: true
    },

    boughAmount: {
        type: Number,
        required: true
    },

    cryptoInWallet: {
        type: Number,
        required: true
    },

    currencyInWallet: {
        type: Number,
        required: true
    },

    transactionDate: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
