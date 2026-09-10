const str = "Hey! 👋 How are you doing? 😊 Okay ❤️ I'll help you. Hmm... 😅 yeah. Good morning! ☀️ 👍 🔥 🎉 🙏";
const clean = str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '');
console.log("Original: " + str);
console.log("Clean: " + clean);
