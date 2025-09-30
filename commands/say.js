const { SlashCommandBuilder, SlashCommandStringOption, ChatInputCommandInteraction, InteractionResponse } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Says stuff")
    .setNSFW(false)
    .addStringOption(
        new SlashCommandStringOption()
        .setName("text")
        .setDescription("Text to send")
        .setRequired(true)
        .setMaxLength(2000)
    ),
    index: "",
    isDeferred: false,
    cooldown: 1000,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {InteractionResponse} deferred
     */
    async execute(interaction, deferred){
        interaction.channel.send(interaction.options.getString("text"));
        await interaction.reply("\u200b");
        interaction.deleteReply();
    },
};