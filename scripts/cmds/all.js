module.exports = {
  config: {
    name: "all",
    version: "1.2",
    author: "FENG",
    countDown: 5,
    role: 1,
    description: "Tag all members in your group chat",
    category: "box chat",
    guide: "{pn} [content | empty]"
  },
  onStart: async function ({ message, event, args }) {
    const { participantIDs } = event;
    const mentions = [];
    let body = args.join(" ") || "@all";
    let i = 0;
    
    for (const uid of participantIDs) {
      if (body.length < participantIDs.length) {
        body += body[body.length - 1];
      }
      mentions.push({ tag: body[i], id: uid, fromIndex: i });
      i++;
    }
    message.reply({ body, mentions });
  }
};
