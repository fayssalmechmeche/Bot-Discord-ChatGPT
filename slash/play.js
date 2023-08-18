const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("The song to play")
        .setStringOption((option) =>
          option
            .setName("song")
            .setDescription("The song to play")
            .setRequired(true)
        )
    )
    .addSubCommand((subcommand) =>
      subcommand
        .setName("song")
        .setDescription("The song to play")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("The playlist to play")
            .setRequired(true)
        )
    )
    .addSubCommand((subcommand) =>
      subcommand
        .setName("seatch")
        .setDescription("Search music")
        .addStringOption((option) =>
          option
            .setName("search")
            .setDescription("search keyword")
            .setRequired(true)
        )
    ),
  run: async (client, interaction) => {
    if (!interaction.member.voice.channel)
      return interaction.editReply("You're not in a voice channel");

    const query = await client.player.createQueue(interaction.guild);
    if (!queue.connection)
      await queue.connect(interaction.member.voice.channel);
    let embed = new MessageEmbed();

    if (interaction.options.getSubcommand() === "song") {
      let url = interaction.options.getString("url");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_VIDEO,
      });
      if (result.tracks.length === 0)
        return interaction.editReply("No results were found");
      const song = result.tracks[0];
      await queue.addTrack(song);
      embed.setTitle("Song added to queue");
      embed.setThumbnail(song.thumbnail);
      embed.setDescription(`[${song.title}](${song.url})`);
      embed.addField("Duration", song.duration);
    } else if (interaction.options.getSubcommand() === "playlist") {
      let url = interaction.options.getString("url");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_PLAYLIST,
      });
      if (result.tracks.length === 0)
        return interaction.editReply("No results were found");
      const playlist = result.playlist;
      await queue.addTrack(playlist);
      embed.setTitle("Song added to queue");
      embed.setThumbnail(song.thumbnail);
      embed.setDescription(`[${song.title}](${song.url})`);
      embed.addField("Duration", song.duration);
    } else if (interaction.options.getSubcommand() === "search") {
      let url = interaction.options.getString("search");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO,
      });
      if (result.tracks.length === 0)
        return interaction.editReply("No results were found");
      const song = result.tracks[0];
      await queue.addTrack(song);
      embed.setTitle("Song added to queue");
      embed.setThumbnail(song.thumbnail);
      embed.setDescription(`[${song.title}](${song.url})`);
      embed.addField("Duration", song.duration);
    }
    if (!queue.playing) await queue.play();
    await interaction.editReply({ embeds: [embed] });
  },
};
