module.exports = {
config: {
name: "addfriend",
aliases: [],
version: "2.4.71",
author: "ST | Sheikh Tamim",
countDown: 10,
role: 2,
shortDescription: { en: "Send friend request to a user" },
description: { en: "Send friend request to a Facebook user by their ID or profile URL" },
category: "owner",
guide: { en: "{pn} <userID>\n{pn} <profile URL>" }
},
onStart: async function ({ api, message, args }) {
try {
if (!args[0]) {
return message.reply("❌ Please provide a user ID or profile URL.\n\nUsage:\n• !addfriend 61579896599103\n• !addfriend https://www.facebook.com/profile.php?id=61579896599103");
}
let userID = args[0];
if (userID.includes("facebook.com")) {
const urlMatch = userID.match(/(?:id=|profile\.php\?id=|facebook\.com\/)(\d+)/);
if (urlMatch && urlMatch[1]) {
userID = urlMatch[1];
} else {
return message.reply("❌ Could not extract user ID from URL.");
}
}
if (!/^\d+$/.test(userID)) {
return message.reply("❌ Invalid user ID format.");
}
const result = await api.sendFriendRequest(userID);
if (result && result.success) {
let msg = "✅ FRIEND REQUEST SENT!\n═══════════════════════\n\n";
msg += `👤 User ID: ${result.userID}\n`;
msg += `📝 Status: ${result.friendshipStatus}\n`;
if (result.actionTitle) msg += `⚡ Action: ${result.actionTitle}\n`;
msg += "\n═══════════════════════\n💡 Request sent!";
message.reply(msg);
} else {
message.reply(`❌ Failed to send request to: ${userID}`);
}
} catch (error) {
console.error(error);
let err = "❌ Error sending request.\n\n";
if (error.message?.includes("GraphQL")) {
err += "• User doesn't exist or blocked requests\n• Already sent\n• Rate limited\n";
} else if (error.error) err += `🔍 ${error.error}\n`;
message.reply(err);
}
}
};
