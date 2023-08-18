const Discord = require("discord.js");
const dotenv = require("dotenv");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const { Player } = require("discord-player");

dotenv.config();

const LOAD_SLASH = process.argv[2] == "load";
const CLIENT_ID = "1141769788520157275";
const GUILD_ID = "1141775566341673101";

const client = new Discord.Client({ intents: 8 });

client.slashcommands = new Discord.Collection();
client.player = new Player(client, {
  ytdlDownloadOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  },
});

let commands = [];

const slashFiles = fs
  .readdirSync("./slash")
  .filter((file) => file.endsWith(".js"));
for (const file of slashFiles) {
  const slashcmd = require(`./slash/${file}`);
  client.slashcommands.set(slashcmd.data.name, slashcmd);
  if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
  console.log("Started refreshing application (/) commands.");
  rest
    .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    })
    .then(
      () => console.log("Successfully registered application commands."),
      process.exit(0)
    )
    .catch(console.error, process.exit(1));
} else {
  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("Music", { type: "LISTENING" });
  });
  client.on("interactionCreate", async (interaction) => {
    async function handleCommand() {
      if (!interaction.isCommand()) return;

      const slashcmd = client.slashcommands.get(interaction.commandName);

      if (!slashcmd) interaction.reply("Command not found");

      await interaction.deferReply();
      await slashcmd.run(client, interaction);
    }
    handleCommand();
  });
  client.login(process.env.TOKEN);
}
