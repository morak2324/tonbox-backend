import { Bot, Context, session } from 'grammy';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../Firebase';
import { applyReferralCode } from '../firebase/users';

// Initialize bot with your token
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// Add session middleware
bot.use(session({
  initial: () => ({
    referralCode: null
  })
}));

// Welcome message template
const getWelcomeMessage = (firstName: string) => `
🎉 Welcome to Tonbox, ${firstName}! 🎉

Get rewarded for being an active TON user! 🚀

✨ What you can earn points for:
• Your wallet's age and history
• TON transactions you've made
• NFTs in your collection
• Inviting friends to join

🎁 Early adopters get special rewards!

Use /help to see all available commands.
`;

// Handle /start command with referral code
bot.command('start', async (ctx) => {
  try {
    const startParam = ctx.match;
    const userId = ctx.from?.id.toString();
    const firstName = ctx.from?.first_name || 'there';

    if (!userId) {
      await ctx.reply('Error: Could not identify user.');
      return;
    }

    // Check if user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user
      const username = ctx.from?.username;
      
      await updateDoc(userRef, {
        id: userId,
        username,
        firstName,
        points: 0,
        totalInvites: 0,
        level: 1,
        balance: 0,
        achievements: 0,
        createdAt: new Date()
      });

      // If there's a referral code, apply it
      if (startParam) {
        const success = await applyReferralCode(userId, startParam);
        if (success) {
          await ctx.reply(
            `${getWelcomeMessage(firstName)}\n\n` +
            '🎈 Bonus: You\'ve been referred and received 1000 points!'
          );
        } else {
          await ctx.reply(
            `${getWelcomeMessage(firstName)}\n\n` +
            '⚠️ Note: The referral code used was invalid.'
          );
        }
      } else {
        await ctx.reply(getWelcomeMessage(firstName));
      }
    } else {
      // Existing user
      if (startParam) {
        await ctx.reply(
          `👋 Welcome back, ${firstName}!\n\n` +
          'You\'ve already joined Tonbox. Want to invite friends? Use /referral to get your invite link!'
        );
      } else {
        await ctx.reply(
          `👋 Welcome back, ${firstName}!\n\n` +
          '🎯 Check your progress with /stats or invite friends with /referral'
        );
      }
    }

  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle /referral command to show user's referral code
bot.command('referral', async (ctx) => {
  try {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply('Error: Could not identify user.');
      return;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    const userData = userDoc.data();
    await ctx.reply(
      `🎁 Share Tonbox with friends!\n\n` +
      `Your referral code: ${userData.referralCode}\n` +
      `Total invites: ${userData.totalInvites}\n\n` +
      `Share this link: https://t.me/${ctx.me.username}?start=${userData.referralCode}\n\n` +
      `💫 Both you and your friend get 1000 points when they join!`
    );

  } catch (error) {
    console.error('Error in referral command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle /stats command to show user's statistics
bot.command('stats', async (ctx) => {
  try {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply('Error: Could not identify user.');
      return;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    const userData = userDoc.data();
    await ctx.reply(
      `📊 Your Tonbox Stats:\n\n` +
      `✨ Points: ${userData.points.toLocaleString()}\n` +
      `🏆 Level: ${userData.level}\n` +
      `👥 Total Invites: ${userData.totalInvites}\n` +
      `🎯 Achievements: ${userData.achievements}\n\n` +
      `Keep earning points by analyzing your wallet and inviting friends!`
    );

  } catch (error) {
    console.error('Error in stats command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle /help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    '🤖 Welcome to Tonbox!\n\n' +
    '📱 Available commands:\n\n' +
    '🎯 /start - Start earning rewards\n' +
    '🎁 /referral - Get your invite link\n' +
    '📊 /stats - View your progress\n' +
    '❓ /help - Show this help message\n\n' +
    '✨ Tip: Use /referral to invite friends and earn bonus points together!'
  );
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

export function startBot() {
  bot.start();
  console.log('Bot started successfully');
}