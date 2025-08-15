const mongoose = require('mongoose');

const MonsterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxHP: { type: Number, default: 100 },
  currentHP: { type: Number, default: 100 },
  completedHabits: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 }
});

module.exports = mongoose.model('Monster', MonsterSchema);
