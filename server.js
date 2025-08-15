const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cron = require('node-cron');
const Habit = require('./models/habit');
const Monster = require('./models/monster');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request body

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/monster', require('./routes/monsterRoutes'));

// Daily Cron Job: Reduce HP for missed habits at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕛 Running daily monster HP update');

  try {
    const monsters = await Monster.find({});

    for (const monster of monsters) {
      const missedHabits = monster.totalHabits - monster.completedHabits;

      if (missedHabits > 0) {
        const damagePerHabit = 10; // HP lost per missed habit
        monster.currentHP -= missedHabits * damagePerHabit;
        if (monster.currentHP < 0) monster.currentHP = 0;
      }

      // Reset completedHabits for new day
      monster.completedHabits = 0;
      await monster.save();

      // Reset all user habits to incomplete
      await Habit.updateMany(
        { userId: monster.userId },
        { completed: false }
      );
    }

    console.log('✅ Daily monster update completed');
  } catch (err) {
    console.error('❌ Error in daily monster update:', err.message);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
