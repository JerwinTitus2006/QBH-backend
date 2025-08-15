const express = require('express');
const Monster = require('../models/monster');
const auth = require('../middleware/authmiddleware');

const router = express.Router();

// Get monster status
router.get('/hp', auth, async (req, res) => {
  try {
    let monster = await Monster.findOne({ userId: req.user.id });

    // If monster not created yet, create a default one
    if (!monster) {
      monster = await Monster.create({ userId: req.user.id });
    }

    res.json({
      maxHP: monster.maxHP,
      currentHP: monster.currentHP,
      completedHabits: monster.completedHabits,
      totalHabits: monster.totalHabits
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error getting monster data', error: err.message });
  }
});

module.exports = router;
