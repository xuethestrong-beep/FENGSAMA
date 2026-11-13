const axios = require("axios");

module.exports = {
  config: {
    name: "philosophy",
    version: "2.0",
    author: "Feng",
    role: 0,
    category: "fun"
  },
  onStart: async function({ message }) {
    const fangYuanPhilosophy = [
      "In this world, only eternal benefit exists. — Fang Yuan",
      "The strong devour the weak, that is the natural law of this world. — Fang Yuan",
      "Good and evil? It's just a matter of perspective. — Fang Yuan",
      "If I cannot have it, then I will destroy it. — Fang Yuan",
      "To live, there is no shame in any method. — Fang Yuan",
      "Man is the spirit of all living beings. — Fang Yuan",
      "Persistence is the most important quality to achieve immortality. — Fang Yuan",
      "Love? It is the most useless thing in this world. — Fang Yuan",
      "The world is a cage, and we are all prisoners seeking freedom. — Fang Yuan",
      "There is no such thing as impossible, only not enough time and effort. — Fang Yuan"
    ];

    const philosophyFallback = [
      "We are what we repeatedly do. Excellence is not an act, but a habit. — Aristotle",
      "The unexamined life is not worth living. — Socrates",
      "He who thinks great thoughts, often makes great errors. — Heidegger",
      "God is dead. God remains dead. And we have killed him. — Nietzsche",
      "I think, therefore I am. — Descartes",
      "Happiness is not an ideal of reason, but of imagination. — Kant",
      "Man is condemned to be free. — Sartre",
      "The only true wisdom is in knowing you know nothing. — Socrates",
      "It is during our darkest moments that we must focus to see the light. — Aristotle",
      "What doesn't kill you makes you stronger. — Nietzsche",
      "To be is to be perceived. — Berkeley",
      "The mind is everything. What you think you become. — Buddha",
      "Existence precedes essence. — Sartre",
      "Life must be understood backward, but lived forwards. — Kierkegaard",
      "The greatest wealth is to live content with little. — Plato",
      "No man's knowledge here can go beyond his experience. — Locke",
      "He who has a why to live can bear almost any how. — Nietzsche",
      "Freedom is what you do with what's been done to you. — Sartre",
      "We suffer more in imagination than in reality. — Seneca",
      "The soul becomes dyed with the color of its thoughts. — Marcus Aurelius",
      "It is not that we have a short time to live, but that we waste a lot of it. — Seneca",
      "Virtue lies in our power to act, not to react. — Aristotle",
      "You have power over your mind - not outside events. — Marcus Aurelius",
      "The purpose of life is to be defeated by greater and greater things. — Rilke",
      "We are all in the gutter, but some of us are looking at the stars. — Oscar Wilde",
      "The only way to deal with an unfree world is to become so absolutely free. — Camus",
      "Doubt is the origin of wisdom. — Descartes",
      "Time is an illusion. — Einstein",
      "Reality is merely an illusion, albeit a very persistent one. — Einstein",
      "The world is my representation. — Schopenhauer",
      "To live is to suffer, to survive is to find some meaning in suffering. — Nietzsche",
      "We are what we pretend to be. — Kurt Vonnegut",
      "The obstacle is the way. — Marcus Aurelius",
      "Every man is a creature of his time. — Voltaire",
      "The eternal returns the same. — Nietzsche",
      "Knowledge is power. — Francis Bacon",
      "Man is born free, and everywhere he is in chains. — Rousseau",
      "I rebel, therefore we exist. — Camus",
      "Philosophy is the battle against the bewitchment of intelligence. — Wittgenstein"
    ];

    const all = [...fangYuanPhilosophy, ...philosophyFallback];

    try {
      const res = await axios.get("https://api.quotable.io/quotes/random?tags=philosophy|wisdom&limit=20");
      const randomAPI = res.data[Math.floor(Math.random() * res.data.length)];
      if (randomAPI) {
        return message.reply(`🧠 Philosophical Thought:\n\n"${randomAPI.content}"\n\n— ${randomAPI.author}`);
      }
    } catch (e) {}

    const randomLocal = all[Math.floor(Math.random() * all.length)];
    return message.reply(`🧠 Philosophical Thought:\n\n"${randomLocal}"`);
  }
};
