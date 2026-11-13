const { getPrefix } = global.utils;
module.exports = {
config: {
name: "friendlist",
aliases: ["fl"],
version: "2.4.71",
author: "Sheikh Tamim",
countDown: 5,
role: 2,
shortDescription: { en: "Show friends list" },
longDescription: { en: "Display all friends list" },
category: "owner",
guide: { en: "{pn} [page]\n{pn} -s <name>" }
},
onStart: async function ({ api, event, args, message }) {
try {
if (args[0] === "-s" || args[0] === "-search") {
const searchQuery = args.slice(1).join(" ");
if (!searchQuery) return message.reply("❌ Please provide search term!");
if (searchQuery.length < 2) return message.reply("❌ Search must be at least 2 chars!");
const searchResults = await new Promise((resolve, reject) => {
api.searchFriends(searchQuery, (err, data) => {
if (err) reject(err);
else resolve(data);
});
});
if (!searchResults || searchResults.length === 0) {
return message.reply(`❌ No friends found with "${searchQuery}"`);
}
let searchMsg = `🔍 SEARCH RESULTS FOR "${searchQuery}"\n📊 Found: ${searchResults.length}\n═══════════════════════════\n\n`;
searchResults.forEach((friend, index) => {
searchMsg += `${index + 1}. ${friend.name}\n 👤 ID: ${friend.userID}\n`;
if (friend.mutualFriends > 0) searchMsg += ` 🤝 ${friend.mutualFriends} mutual\n`;
searchMsg += `─────────────────────────\n`;
});
searchMsg += `\n💡 Reply "unfriend <number>" to unfriend`;
return message.reply(searchMsg, (err, info) => {
if (!err) {
global.GoatBot.onReply.set(info.messageID, {
commandName: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
searchResults: searchResults,
searchQuery: searchQuery,
isSearchResult: true
});
}
});
}
const friendsData = await new Promise((resolve, reject) => {
api.friendList((err, data) => {
if (err) reject(err);
else resolve(data);
});
});
if (!friendsData || !friendsData.friends || friendsData.friends.length === 0) {
return message.reply("❌ No friends found.");
}
const page = parseInt(args[0]) || 1;
const friendsPerPage = 10;
const totalPages = Math.ceil(friendsData.friends.length / friendsPerPage);
if (page > totalPages || page < 1) {
return message.reply(`❌ Invalid page. Available: 1-${totalPages}`);
}
const startIndex = (page - 1) * friendsPerPage;
const friendsToShow = friendsData.friends.slice(startIndex, startIndex + friendsPerPage);
let friendsList = `👥 FRIENDS LIST (Page ${page}/${totalPages})\n📊 Total: ${friendsData.friendCount || friendsData.friends.length}\n═══════════════════════════\n\n`;
friendsToShow.forEach((friend, index) => {
const displayIndex = startIndex + index + 1;
friendsList += `${displayIndex}. ${friend.name}\n 👤 ID: ${friend.userID}\n 🌐 Gender: ${friend.gender || 'Unknown'}\n─────────────────────────\n`;
});
friendsList += `\n💡 Reply page number to navigate\n• Reply "unfriend <number>" to unfriend\n• ${getPrefix(event.threadID)}friendlist -s <name> to search`;
return message.reply(friendsList, (err, info) => {
if (!err) {
global.GoatBot.onReply.set(info.messageID, {
commandName: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
friendsData: friendsData,
currentPage: page,
totalPages: totalPages,
friendsPerPage: friendsPerPage,
isSearchResult: false
});
}
});
} catch (error) {
return message.reply(`❌ Error: ${error.message}`);
}
},
onReply: async function ({ message, event, Reply, api }) {
const { author, isSearchResult } = Reply;
if (event.senderID !== author) return message.reply("❌ You can't use this reply!");
const input = event.body.trim().toLowerCase();
if (input.startsWith("unfriend ") || input.startsWith("r ")) {
const numberStr = input.replace(/^(unfriend|r)\s+/, "");
const friendNumber = parseInt(numberStr);
if (isNaN(friendNumber) || friendNumber < 1) return message.reply("❌ Invalid number!");
let friend;
if (isSearchResult) {
friend = Reply.searchResults[friendNumber - 1];
} else {
friend = Reply.friendsData.friends[friendNumber - 1];
}
if (!friend) return message.reply("❌ Friend not found!");
try {
message.reply(`⏳ Unfriending ${friend.name}...`);
await new Promise((resolve, reject) => {
api.unfriend(friend.userID, (err, data) => {
if (err) reject(err);
else resolve(data);
});
});
return message.reply(`✅ Unfriended ${friend.name}`);
} catch (error) {
return message.reply(`❌ Failed: ${error.message}`);
}
}
if (!isSearchResult) {
const { friendsData, totalPages, friendsPerPage } = Reply;
const newPage = parseInt(input);
if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
const startIndex = (newPage - 1) * friendsPerPage;
const friendsToShow = friendsData.friends.slice(startIndex, startIndex + friendsPerPage);
let friendsList = `👥 FRIENDS LIST (Page ${newPage}/${totalPages})\n═══════════════════════════\n\n`;
friendsToShow.forEach((friend, index) => {
const displayIndex = startIndex + index + 1;
friendsList += `${displayIndex}. ${friend.name}\n 👤 ID: ${friend.userID}\n─────────────────────────\n`;
});
return message.reply(friendsList, (err, info) => {
if (!err) {
global.GoatBot.onReply.set(info.messageID, {
commandName: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
friendsData: friendsData,
currentPage: newPage,
totalPages: totalPages,
friendsPerPage: friendsPerPage,
isSearchResult: false
});
}
});
}
}
return message.reply(`❌ Invalid input!`);
}
};
