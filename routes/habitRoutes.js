const express = require('express');
const Habit = require('../models/habit');
const Monster = require('../models/monster');
const auth = require('../middleware/authmiddleware');

const router = express.Router();

// Add new habit
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const habit = new Habit({ userId: req.user.id, name });
    await habit.save();

    // Update or create monster for this user
    let monster = await Monster.findOne({ userId: req.user.id });
    if (monster) {
      monster.totalHabits += 1;
      await monster.save();
    } else {
      monster = await Monster.create({
        userId: req.user.id,
        totalHabits: 1,
        maxHP: 100,
        currentHP: 100,
        completedHabits: 0
      });
    }

    res.json({ habit, monster });
  } catch (err) {
    res.status(500).json({ msg: 'Error creating habit', error: err.message });
  }
});

// Get user habits
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching habits', error: err.message });
  }
});

// Mark habit as completed/uncompleted
router.patch('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });

    const wasIncomplete = !habit.completed;
    const wasCompleted = habit.completed;

    habit.completed = req.body.completed;
    await habit.save();

    const monster = await Monster.findOne({ userId: req.user.id });
    if (monster) {
      // Calculate proportional damage
      const damagePerHabit = monster.totalHabits > 0 
        ? monster.maxHP / monster.totalHabits 
        : 0;

      if (wasIncomplete && req.body.completed) {
        monster.completedHabits += 1;
        monster.currentHP = Math.max(monster.currentHP - damagePerHabit, 0);
      } 
      else if (wasCompleted && !req.body.completed) {
        monster.completedHabits = Math.max(monster.completedHabits - 1, 0);
        monster.currentHP = Math.min(monster.currentHP + damagePerHabit, monster.maxHP);
      }
      await monster.save();
    }

    res.json({ habit, monster });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating habit', error: err.message });
  }
});

// Delete habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });

    const monster = await Monster.findOne({ userId: req.user.id });
    if (monster) {
      // Adjust damage proportionally
      const damagePerHabit = monster.totalHabits > 0 
        ? monster.maxHP / monster.totalHabits 
        : 0;

      monster.totalHabits = Math.max(monster.totalHabits - 1, 0);

      if (habit.completed) {
        monster.completedHabits = Math.max(monster.completedHabits - 1, 0);
        monster.currentHP = Math.min(monster.currentHP + damagePerHabit, monster.maxHP);
      }

      await monster.save();
    }

    await habit.deleteOne();
    res.json({ msg: 'Habit deleted', monster });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting habit', error: err.message });
  }
});

module.exports = router;
