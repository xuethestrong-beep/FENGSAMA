const axios = require("axios");
module.exports = {
  config: { name: "quote", version: "3.0", author: "Feng", role: 0, category: "fun" },
  onStart: async function({ message }) {
    const list = [
      "Not all storms come to disrupt your life, some clear your path.",
      "Trust no one, fear no one, respect everyone.",
      "Your comfort zone will kill you.",
      "People don't change, they reveal who they are.",
      "Silence is better than fake words.",
      "Loyalty is rare, if you find it, keep it.",
      "Stay real, stay loyal, or stay away.",
      "Built from the ashes, stronger than before.",
      "The strongest hearts have the most scars.",
      "Kill them with success, bury them with a smile.",
      "Stars can't shine without darkness.",
      "No rain, no flowers.",
      "Your scars are proof you fought.",
      "Never beg for love, respect, or attention.",
      "The devil was once an angel too.",
      "The same boiling water that softens the potato hardens the egg.",
      "Be a good person, but don't waste time proving it.",
      "Don't be afraid of being alone, be afraid of being in the wrong company.",
      "Energy is contagious, be careful who you stand next to.",
      "Work until your idols become your rivals.",
      "Hustle in silence, let success make noise.",
      "Don't chase, attract.",
      "The wolf on the hill is never as hungry as the wolf climbing the hill.",
      "Be so good they can't ignore you.",
      "Greatness comes from darkness.",
      "Turn your wounds into wisdom. — Oprah",
      "Smile, it confuses your enemies.",
      "Don't tell people your plans, show them your results.",
      "One day they will need you, and you will be gone.",
      "Life is 10% what happens, 90% how you react.",
      "Be the storm, not the one who fears it.",
      "Your future needs you, your past doesn't.",
      "Don't wait for opportunity. Create it.",
      "Sometimes later becomes never. Do it now.",
      "It's going to be hard, but hard does not mean impossible.",
      "Believe you can and you're halfway there. — Roosevelt",
      "Push yourself, because no one else will do it for you.",
      "Great things never come from comfort zones.",
      "Success doesn't just find you. You have to go out and get it.",
      "The harder you work, the luckier you get.",
      "Wake up with determination. Go to bed with satisfaction.",
      "Do something today that your future self will thank you for.",
      "Blood makes you related, loyalty makes you family.",
      "If you want peace, prepare for war.",
      "Let them hate, just make sure they spell your name right.",
      "The best revenge is no revenge, move on and be happy.",
      "Kings don't beg, they conquer.",
      "Your time is limited, don't waste it living someone else's life. — Steve Jobs",
      "Be yourself; everyone else is already taken. — Oscar Wilde",
      "It always seems impossible until it's done. — Mandela"
    ];
    try {
      const res = await axios.get("https://api.quotable.io/random");
      return message.reply(`"${res.data.content}"\n\n— ${res.data.author}`);
    } catch {
      try {
        const res2 = await axios.get("https://zenquotes.io/api/random");
        const q = res2.data[0];
        return message.reply(`"${q.q}"\n\n— ${q.a}`);
      } catch {
        return message.reply(list[Math.floor(Math.random() * list.length)]);
      }
    }
  }
};
