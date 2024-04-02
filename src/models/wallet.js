const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  currency: [
    {
      currencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currency",
      },

      amount: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;