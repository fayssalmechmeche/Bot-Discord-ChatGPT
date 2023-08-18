const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shows the queue")
    .addNumberOption((option) =>
      option
        .setName("page")
        .setDescription("The page of the queue")
        .setMinValue(1)
    ),
  run: async ({ client, interaction }) => {
    const queue = client.player.getQueue(interaction.guildId);
    if (!queue || !queue.playing)
      return interaction.reply("No music is playing");
    const totalPage = Math.ceil(queue.tracks.length / 10) || 1;
    const page = interaction.options.getNumber("page") || 1;

    if (page < 1 || page > totalPage)
      return interaction.reply("Invalid page number");

    const queueString = queue.tracks
      .slice(10 * page, 10 * page + 10)
      .map((song, i) => {
        return `**${page * 10 + i + 1}. ${song.title} -- <@${
          song.requestedBy.id
        }>`;
      });

    const currentSong = queue.current;

    await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setTitle("Queue")
          .setDescription(
            `**Current Song:**\n[${currentSong.title}](${
              currentSong.url
            }) -- <@${
              currentSong.requestedBy.id
            }>\n\n**Up Next:**\n${queueString.join("\n")}`
          )
          .setFooter(`Page ${page} of ${totalPage}`),
      ],
    });
  },
};
