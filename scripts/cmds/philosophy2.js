const axios = require("axios");

module.exports = {
  config: {
    name: "philosophy2",
    aliases: ["chinesephil", "cphil"],
    version: "1.0",
    author: "Feng",
    role: 0,
    category: "fun"
  },
  onStart: async function({ message }) {
    const list = [
      "He who knows he does not know is the best. — Lao Tzu",
      "The journey of a thousand miles begins with one step. — Lao Tzu",
      "Silence is a source of great strength. — Lao Tzu",
      "Nature does not hurry, yet everything is accomplished. — Lao Tzu",
      "Be still like a mountain and flow like a great river. — Lao Tzu",
      "Knowing others is wisdom, knowing yourself is enlightenment. — Lao Tzu",
      "Life is a series of natural and spontaneous changes. Don't resist them. — Lao Tzu",
      "When I let go of what I am, I become what I might be. — Lao Tzu",
      "It does not matter how slowly you go as long as you do not stop. — Confucius",
      "Our greatest glory is not in never failing, but in rising every time we fail. — Confucius",
      "The man who moves a mountain begins by carrying away small stones. — Confucius",
      "To be wronged is nothing unless you continue to remember it. — Confucius",
      "Choose a job you love, and you will never have to work a day in your life. — Confucius",
      "Everything has beauty, but not everyone sees it. — Confucius",
      "Real knowledge is to know the extent of one's ignorance. — Confucius",
      "Before you embark on a journey of revenge, dig two graves. — Confucius",
      "The superior man is modest in his speech, but exceeds in his actions. — Confucius",
      "Wheresoever you go, go with all your heart. — Confucius",
      "If you know the enemy and know yourself, you need not fear the result of a hundred battles. — Sun Tzu",
      "In the midst of chaos, there is also opportunity. — Sun Tzu",
      "Appear weak when you are strong, and strong when you are weak. — Sun Tzu",
      "The supreme art of war is to subdue the enemy without fighting. — Sun Tzu",
      "Victorious warriors win first and then go to war. — Sun Tzu",
      "All warfare is based on deception. — Sun Tzu",
      "Opportunities multiply as they are seized. — Sun Tzu",
      "Happiness is the absence of striving for happiness. — Zhuangzi",
      "Flow with whatever may happen. — Zhuangzi",
      "I dreamed I was a butterfly. Was I then a man dreaming I was a butterfly? — Zhuangzi",
      "Those who realize their folly are not true fools. — Zhuangzi",
      "A frog in a well cannot conceive of the ocean. — Zhuangzi",
      "If you cannot find the truth right where you are, where else do you expect to find it? — Dogen (Zen)",
      "Let your heart be like still water. — Chinese Proverb",
      "A wise man makes his own decisions, an ignorant man follows public opinion. — Chinese Proverb",
      "One who is patient will see the best outcome. — Chinese Proverb",
      "Talk does not cook rice. — Chinese Proverb",
      "He who asks is a fool for five minutes, he who does not ask remains a fool forever. — Chinese Proverb",
      "Learning is a treasure that will follow its owner everywhere. — Chinese Proverb",
      "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
      "A single conversation with a wise man is better than ten years of study. — Chinese Proverb",
      "Be not afraid of going slowly, be afraid only of standing still. — Chinese Proverb",
      "If you are patient in one moment of anger, you will escape a hundred days of sorrow. — Chinese Proverb",
      "Do not fear going forward slowly, fear only to stand still. — Chinese Proverb",
      "Water can carry a boat, but it can also overturn it. — Chinese Proverb",
      "He who knows others is wise, he who knows himself is enlightened. — Chinese Proverb",
      "A book is like a garden carried in the pocket. — Chinese Proverb",
      "To know what you know and what you do not know, that is true knowledge. — Confucius",
      "The gem cannot be polished without friction. — Confucius",
      "The mind that is always busy cannot find peace. — Chinese Proverb",
      "Great souls suffer in silence. — Chinese Proverb",
      "When the winds of change blow, some build walls, others build windmills. — Chinese Proverb"
    ];

    try {
      const res = await axios.get("https://api.quotable.io/quotes/random?tags=wisdom&limit=15");
      if (res.data && res.data.content) {
        // 50% chance API, 50% Chinese list
        if (Math.random() > 0.5) {
          return message.reply(`"${res.data.content}"\n\n— ${res.data.author}`);
        }
      }
    } catch {}

    const random = list[Math.floor(Math.random() * list.length)];
    return message.reply(random);
  }
};
