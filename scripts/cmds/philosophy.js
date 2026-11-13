const axios = require("axios");
module.exports = {
  config: { name: "philosophy", version: "3.0", author: "Feng", role: 0, category: "fun" },
  onStart: async function({ message }) {
    const list = [
      "We suffer more in imagination than in reality. — Seneca",
      "Hell is other people. — Sartre",
      "The abyss gazes also into you. — Nietzsche",
      "God is dead and we have killed him. — Nietzsche",
      "Life has no meaning, we give it meaning.",
      "We are born alone, we live alone, we die alone. — Orson Welles",
      "Pain is inevitable, but suffering is a choice.",
      "The darkest nights produce the brightest stars.",
      "No one saves us but ourselves. — Buddha",
      "You are free, and that is why you are lost. — Kafka",
      "The wound is the place where the light enters you. — Rumi",
      "We are all broken, that's how the light gets in. — Hemingway",
      "Monsters are real. They live inside us. — Stephen King",
      "The only way out is through. — Robert Frost",
      "Comfort is the enemy of progress.",
      "Without darkness, we would never see the stars.",
      "He who has a why to live can bear almost any how. — Nietzsche",
      "Existence is pain to an intelligent man. — Dostoevsky",
      "One must imagine Sisyphus happy. — Camus",
      "To live is to suffer, to survive is to find meaning. — Frankl",
      "The mind can make a heaven of hell. — Milton",
      "Hope is the worst of evils, it prolongs torment. — Nietzsche",
      "Silence is the language of the wise.",
      "Time heals, but scars prove you fought.",
      "The quieter you become, the more you can hear. — Ram Dass",
      "It is better to be hated for what you are than loved for what you are not.",
      "Suffering has been stronger than all other teaching. — Dickens",
      "The world breaks everyone and afterward many are strong at the broken places. — Hemingway",
      "Man is condemned to be free. — Sartre",
      "The unexamined life is not worth living. — Socrates",
      "We are what we repeatedly do. Excellence is not an act, but a habit. — Aristotle",
      "Life must be understood backward, but lived forwards. — Kierkegaard",
      "Doubt is the origin of wisdom. — Descartes",
      "The obstacle is the way. — Marcus Aurelius",
      "We suffer more in imagination than in reality. — Seneca",
      "You have power over your mind - not outside events. — Marcus Aurelius",
      "It is during our darkest moments that we must focus to see the light. — Aristotle",
      "Virtue lies in our power to act, not to react. — Aristotle",
      "Reality is merely an illusion. — Einstein",
      "Man is born free, and everywhere he is in chains. — Rousseau",
      "I rebel, therefore we exist. — Camus",
      "Darkness cannot drive out darkness, only light can. — MLK",
      "Not all those who wander are lost. — Tolkien",
      "We are all apprentices in a craft where no one ever becomes a master. — Hemingway",
      "Everything you have ever wanted is on the other side of fear.",
      "The purpose of life is to be defeated by greater things. — Rilke",
      "We are what we pretend to be. — Vonnegut",
      "To know yourself, you must sacrifice the illusion that you already do.",
      "Knowledge is power. — Francis Bacon",
      "Life is a storm. — Dumas"
    ];
    try {
      const res = await axios.get("https://api.quotable.io/quotes/random?tags=philosophy|wisdom&limit=20");
      const p = res.data[Math.floor(Math.random() * res.data.length)];
      if (p) return message.reply(`"${p.content}"\n\n— ${p.author}`);
    } catch {}
    return message.reply(list[Math.floor(Math.random() * list.length)]);
  }
};
