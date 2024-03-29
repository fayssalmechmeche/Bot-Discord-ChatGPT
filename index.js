import {
  ChannelType,
  Client,
  GatewayIntentBits,
  IntentsBitField,
  PermissionFlagsBits,
  REST,
  Routes,
} from "discord.js";

import OpenAI from "openai";
import "dotenv/config";
import slugify from "slugify";
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const commands = [
  {
    name: "aventure",
    description: "Commencer une aventure avec Fayce bot !",
  },
];

let serverID = [];
let conversationLog = [];
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const openai = new OpenAI(process.env.OPENAI_API_KEY);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(Routes.applicationCommands(process.env.APPID), {
    body: commands,
  });

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setPresence({
    activities: [{ name: "GPT Aventure !" }],
    status: "online",
  });
  conversationLog.push({
    role: "system",
    content:
      "tu es un maître de jeu de rôle. Tu vas guider un personnage à travers un monde fantastique rempli de monstres et de héros. À chaque étape, tu lui proposeras 3 choix possibles. Chaque choix a des conséquences et le joueur doit tout faire pour que son personnage survive. Le jeu se termine lorsque le personnage du joueur meurt. Dans ta première réponse, demande-lui son nom. Dans la deuxième réponse, demande-lui sa classe (chevalier, mage, archer, etc.). Dans la troisième réponse, demande-lui sa race (humain, elfe, nain, etc.). L'histoire se déroule dans un monde fantastique où un dragon terrifiant règne au sommet d'un volcan. Le but ultime du héros est de vaincre ce dragon. Prépare-toi à improviser de nombreux défis pour guider le joueur jusqu'au dragon. Une fois que le joueur a choisi sa classe et sa race, tu pourras commencer l'aventure en fonction de ses choix. Lorsque tu présenteras les choix. Tu dois prendre en compte ses réponses pour créer une expérience immersive et captivante. Les choix doivent devenir de plus en plus compliqué jusqu'à pousser le joueur à choisir le mauvais choix et mourir. Donc un de tes choix doit etre un mauvais choix pour l'utilisateur. Si le joueur décide de mettre fin à l'aventure, tu dois absulument répondre `Fin de l'aventure !`.",
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
  if (interaction.commandName === "aventure") {
    if (interaction.channel.id !== process.env.SERVEUR) {
      interaction.reply("Vous n'avez pas le droit de faire ça ici !");
      return;
    }

    let slug = slugify(interaction.user.username, {
      remove: /[*+~.()'"!:@]/g,
      lower: true,
    });

    if (
      interaction.guild.channels.cache.find(
        (channel) => channel.name === `gpt-aventure-${slug}`
      )
    ) {
      interaction.reply("Vous avez déjà une partie en cours !");
      return;
    }
    let channel = await interaction.guild.channels.create({
      name: `GPT Aventure-${interaction.user.username}`,
      type: ChannelType.GUILD_TEXT,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    channel.send(
      `C'est ici que ça ton aventure va commencer ! <@${interaction.user.id}>`
    );
    serverID.push(channel.id);

    await interaction.channel.send(
      "Un salon a été crée ta partie, pour jouer, écris un message dans le channel `gpt-aventure`"
    );
  }
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!serverID.includes(msg.channel.id)) return;
  if (msg.content.startsWith("!")) return;
  await msg.channel.permissionOverwrites.set([
    {
      id: msg.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    },
    {
      id: msg.author.id,
      deny: [PermissionFlagsBits.SendMessages],
      allow: [PermissionFlagsBits.ViewChannel],
    },
  ]);

  await msg.channel.sendTyping();

  let previousMessage = await msg.channel.messages.fetch({ limit: 15 });
  await previousMessage.reverse();

  // if (msg.content.startsWith("Jouer")) {
  //   // supprimer tout les messages sauf celui envoyé par l'utilisateur

  //   await msg.channel.messages.cache.forEach((message) => {
  //     if (message.id == msg.id) return;
  //     message.delete();
  //   });

  //   await msg.channel.send("Nouvelle Aventure !");
  // }
  await previousMessage.forEach((message) => {
    if (message.author.bot && message.author.id !== client.user.id) return;
    if (message.content.startsWith("!")) return;
    if (message.author.id !== msg.author.id) return;
    conversationLog.push({
      role: "user",
      content: `${message.content}.`,
    });
  });

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: conversationLog,
  });

  await conversationLog.push({
    role: "system",
    content: result.choices[0].message.content,
  });

  console.log("conversationLog");
  console.log(conversationLog);

  await msg.reply(result.choices[0].message);
  await msg.channel.permissionOverwrites.set([
    {
      id: msg.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    },
    {
      id: msg.author.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    },
  ]);

  if (
    result.choices[0].message.content.includes("Fin de l'aventure") ||
    result.choices[0].message.content.includes("fin de l'aventure") ||
    result.choices[0].message.content.includes("fin à l'aventure") ||
    result.choices[0].message.content.includes("Fin à l'aventure") ||
    result.choices[0].message.content.includes("Fin de ton aventure") ||
    result.choices[0].message.content.includes("l'aventure prend fin")
  ) {
    await msg.channel.permissionOverwrites.set([
      {
        id: msg.guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
      },
      {
        id: msg.author.id,
        deny: [PermissionFlagsBits.SendMessages],
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ]);
    msg.channel.send("Fin de l'aventure !");
    msg.channel.send("Merci d'avoir joué !");
    msg.channel.send("Vous pouvez fermer ce channel.");
    msg.channel.send("Ce channel sera supprimé dans 60 secondes.");
    setTimeout(() => {
      msg.channel.delete();
    }, 60000);
  }
});

client.login(process.env.TOKEN);
