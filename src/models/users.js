const mongoose = require("mongoose");

const usersSchema = mongoose.Schema({
  userId: {
    type: String,
  },
  displayName: {
    type: String,
    required: true,
  },
  username: String,
  email: String,
  provider: {
    type: String,
    enum: ["github", "google", "default"],
    default: "default",
  },
  password: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

usersSchema.index({ userId: 1, username: 1 });
usersSchema.index({ userId: 1, email: 1 });

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
