import { Client, GatewayIntentBits, IntentsBitField } from "discord.js";

import OpenAI from "openai";
import "dotenv/config";
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  let prompt;

  client.user.setPresence({
    activities: [{ name: "GPT Aventure !" }],
    status: "online",
  });
});

const openai = new OpenAI(process.env.OPENAI_API_KEY);

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.id !== process.env.SERVEUR) return;
  if (msg.content.startsWith("!")) return;

  let conversationLog = [
    {
      role: "system",
      content:
        "tu es un maître de jeu de rôle. Tu vas guider un personnage à travers un monde fantastique rempli de monstres et de héros. À chaque étape, tu lui proposeras 3 choix possibles. Chaque choix a des conséquences et le joueur doit tout faire pour que son personnage survive. Le jeu se termine lorsque le personnage du joueur meurt. Dans ta première réponse, demande-lui son nom. Dans la deuxième réponse, demande-lui sa classe (chevalier, mage, archer, etc.). Dans la troisième réponse, demande-lui sa race (humain, elfe, nain, etc.). L'histoire se déroule dans un monde fantastique où un dragon terrifiant règne au sommet d'un volcan. Le but ultime du héros est de vaincre ce dragon. Prépare-toi à improviser de nombreux défis pour guider le joueur jusqu'au dragon. Une fois que le joueur a choisi sa classe et sa race, tu pourras commencer l'aventure en fonction de ses choix. Lorsque tu présenteras les choix, indique clairement les numéros correspondants à chaque option et demande au joueur. N'hésite pas à prendre en compte ses réponses pour créer une expérience immersive et captivante.",
    },
  ];

  await msg.channel.sendTyping();

  let previousMessage = await msg.channel.messages.fetch();

  previousMessage.reverse();
  previousMessage.forEach((message) => {
    if (message.author.bot && message.author.id !== client.user.id) return;
    if (message.content.startsWith("!")) return;
    if (message.author.id !== msg.author.id) return;
    conversationLog.push({
      role: "user",
      content: `Mon choix est ${message.content}.`,
    });
    console.log(message.content);
  });
  if (conversationLog.length > 1) {
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationLog,
    });

    conversationLog.push({
      role: "system",
      content: result.choices[0].message,
    });
    msg.reply(result.choices[0].message);
  } else {
    msg.reply(conversationLog[0].content);
  }
});

client.login(process.env.TOKEN);
