const fs = require("fs-extra");
const path = require("path");

const facts = [
"Your brain treats rejection like physical pain.",
"People who swear more are more honest.",
"Being alone too long is as bad as smoking 15 cigarettes a day.",
"90% of people text things they can't say face to face.",
"Fake smile long enough and your brain makes it real.",
"Smart people have fewer friends - more selective.",
"People remember how you made them feel, not what you said.",
"Ask for a small favor to make someone like you more.",
"If you can't stop thinking about someone, they thought of you first.",
"Overthinkers are best at solving others' problems.",
"Your favorite song is tied to an emotional event.",
"Intelligent people stay up late.",
"If someone laughs at dumb jokes a lot, they're lonely.",
"Being ignored triggers same chemicals as injury.",
"You look more attractive when the other person is happy.",
"Your mind wanders 30% of the day.",
"Walking fast = more confident.",
"Silence after a question makes people talk more.",
"Dressing well stabilizes your mood.",
"Announcing goals makes you less likely to achieve them.",
"The smarter you are, the harder to fall in love.",
"People with dark humor have higher IQ.",
"Your brain is more creative when tired.",
"Eye contact 60% = interested, less = not.",
"Crying first tear from right eye = happy, left = sad.",
"People who understand sarcasm are good at reading minds.",
"The person who tries to keep everyone happy is loneliest.",
"Your brain does more to avoid loss than to gain reward.",
"We are attracted to people with same music taste.",
"People who blush easily are more empathetic.",
"If someone mirrors your body language, they like you.",
"Nostalgia makes you more optimistic about future.",
"Talking to yourself makes you smarter.",
"People who sleep 6-7 hours live longer than 8+ hours.",
"Your brain deletes boring things to save energy.",
"Stress makes your brain shrink temporarily.",
"Complaining physically shrinks your hippocampus.",
"Gratitude literally rewires your brain.",
"People judge you in first 7 seconds.",
"Your pupils dilate when you see someone you love.",
"If you hold hands with someone you love, pain reduces.",
"Love works like addiction in the brain.",
"Heartbreak activates same area as cocaine withdrawal.",
"You can't multitask, you just switch fast and lose 40% efficiency.",
"Blue color makes you more productive.",
"People who are brutally honest have better mental health.",
"Your brain needs 66 days to form a habit, not 21.",
"Sarcasm makes you more creative.",
"Laziness is often high intelligence - finding easier way.",
"People who overthink have higher activity in fear area.",
"Writing down negative thoughts and burning them helps.",
"People who curse when hurt actually feel less pain.",
"Your brain lies to you to make you feel better - false memories.",
"Money can buy happiness up to 75k/year, after that no effect.",
"Kids who lie well early become more successful.",
"People who bite nails are perfectionists.",
"Daydreamers are more creative and better problem solvers.",
"Anger makes you think you're more intelligent than you are.",
"People who talk about themselves 60% of the time in conversation.",
"Your brain filters 99% of what you see.",
"If you want someone to like you, ask about their passion.",
"People who sit with open posture are more confident.",
"Your voice changes when you talk to someone you like.",
"People who apologize too much have low self-esteem.",
"Humans need 4 hugs a day to survive, 8 to maintain, 12 to grow.",
"You remember bad feedback 5x more than good.",
"People who exercise have better memory.",
"Chew gum to reduce anxiety and improve focus.",
"People who make eye contact while speaking are more persuasive.",
"Your brain makes decisions 7 seconds before you consciously do.",
"People who swear have larger vocabulary.",
"Loneliness makes you feel colder - literally.",
"Holding warm drink makes you seem friendlier to others.",
"People who are messy are more creative.",
"Your brain can't tell difference between real and imagined - use visualization.",
"People who play video games have better dream control.",
"Reading fiction makes you more empathetic.",
"People who stay calm under pressure have trained their amygdala.",
"Jealousy comes from low self-esteem, not love.",
"People who use more emojis have more sex.",
"Your brain loves unfinished tasks - Zeigarnik effect.",
"People who sing in shower are less depressed.",
"Dark rooms make you more honest.",
"People who gossip have higher social intelligence.",
"Your brain replays embarrassing moments to learn, not to torture you.",
"People who walk in nature for 90 mins reduce negative thoughts.",
"Second born children are more rebellious.",
"People who sleep on stomach are more anxious.",
"Your brain can only hold 4 things in conscious at once.",
"People who use both hands equally are more emotionally unstable.",
"Optimists live 11-15% longer.",
"People who swear when they are angry live longer.",
"Your brain processes negative news faster than positive.",
"People who make bed in morning are more productive.",
"Touch from someone you trust reduces stress hormone cortisol.",
"People who talk with hands are more popular.",
"Your brain has negativity bias to protect you.",
"People who cry easily are mentally stronger - they release stress.",
"If you want to remember, write by hand not type.",
"People who love black color want power and control.",
"Your brain needs boredom to grow new ideas."
];

let interval = null;

module.exports = {
  config: {
    name: "psychology",
    version: "3.1",
    role: 1,
    category: "admin",
    guide: "{pn} auto on/off"
  },

  onLoad: ({ api }) => {
    const dir = path.join(__dirname, "cache");
    const p = path.join(dir, "psychology.json");
    fs.ensureDirSync(dir);
    if (!fs.existsSync(p)) fs.writeJsonSync(p, { global: false, used: [] });
    if (interval) clearInterval(interval);

    interval = setInterval(async () => {
      let data = fs.readJsonSync(p);
      if (!data.global) return;

      // get random that hasn't been used
      if (!data.used) data.used = [];
      if (data.used.length >= facts.length) data.used = []; // reset when all used

      let available = facts.map((_, i) => i).filter(i => !data.used.includes(i));
      let idx = available[Math.floor(Math.random() * available.length)];
      data.used.push(idx);
      fs.writeJsonSync(p, data);

      const txt = facts[idx];
      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        for (const t of threads.filter(t => t.isGroup)) {
          await api.sendMessage(`🧠 Psychology [${data.used.length}/${facts.length}]:\n${txt}`, t.threadID);
          await new Promise(r => setTimeout(r, 1200));
        }
      } catch {}
    }, 10 * 60 * 1000);
  },

  onStart: async ({ message, args }) => {
    const p = path.join(__dirname, "cache", "psychology.json");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    if (!fs.existsSync(p)) fs.writeJsonSync(p, { global: false, used: [] });
    let data = fs.readJsonSync(p);

    if (args[0] === "auto") {
      if (args[1] === "on") {
        data.global = true;
        fs.writeJsonSync(p, data);
        return message.reply(`✅ Global ON - ${facts.length} facts will never repeat until all used`);
      }
      if (args[1] === "off") {
        data.global = false;
        fs.writeJsonSync(p, data);
        return message.reply("❌ Global OFF");
      }
      return message.reply(`Status: ${data.global ? "ON" : "OFF"} | Used: ${data.used?.length || 0}/${facts.length}`);
    }

    // manual - also non-repeating
    if (!data.used) data.used = [];
    if (data.used.length >= facts.length) data.used = [];
    let available = facts.map((_, i) => i).filter(i => !data.used.includes(i));
    let idx = available[Math.floor(Math.random() * available.length)];
    data.used.push(idx);
    fs.writeJsonSync(p, data);
    return message.reply(`🧠 Psychology [${data.used.length}/${facts.length}]:\n${facts[idx]}`);
  }
};
