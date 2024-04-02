const mongoose = require('mongoose');

const historySchema = mongoose.Schema({
    currencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency'
    },
    ratio: {
        type: Array,
        default: []
    }
});

const CurrencyHistory = mongoose.model('History', historySchema);

module.exports = CurrencyHistory;
