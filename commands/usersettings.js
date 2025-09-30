const { SlashCommandBuilder, AutocompleteInteraction, SlashCommandSubcommandBuilder, SlashCommandStringOption, ChatInputCommandInteraction, InteractionResponse, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require("node:fs");
const path = require("node:path");
const userTemplate = require("../assets/userTemplate.json");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("usersettings")
    .setDescription("User-specific settings for the bot")
    .setNSFW(false)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("pronouns")
        .setDescription("Set your preferred pronouns for interactions with the bot")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("pronouns")
            .setDescription("The pronouns to be set")
            .setRequired(true)
            .setMaxLength(40)
        )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("clear")
        .setDescription("Clear user settings")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("setting")
            .setDescription("The setting to clear")
            .setRequired(true)
            .setChoices(
                {name: "Pronouns", value: "pronouns"},
            )
        )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("view")
        .setDescription("View current user settings")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("setting")
            .setDescription("The setting to view")
            .setRequired(true)
            .setChoices(
                {name: "Pronouns", value: "pronouns"},
            )
        )
    ),
    index: "",
    isDeferred: false,
    cooldown: 1000,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {InteractionResponse} deferred
     */
    async execute(interaction, deferred){
        let color = interaction.guild?.me?.displayHexColor || process.env.DEFAULT_COLOR;
        let embed = new EmbedBuilder().setColor(color);
        let text = "";

        let userData = interaction.client.userData[interaction.user.id];
        if(!userData) {
            userData = JSON.parse(JSON.stringify(userTemplate));
            userData.id = interaction.user.id;
        }

        switch(interaction.options.getSubcommand()){
            case "pronouns":
                userData.pronouns = interaction.options.getString("pronouns") ?? null;
                interaction.reply({embeds: [embed.setDescription(`Your preferred pronouns have been updated to \`${userData.pronouns}\`.`)], flags: MessageFlags.Ephemeral});
                break;

            case "clear":
                switch(interaction.options.getString("setting")){
                    case "pronouns":
                        userData.pronouns = null;
                        text = "Your preferred pronouns have been removed.";
                        break;
                }
                interaction.reply({embeds: [embed.setDescription(text)], flags: MessageFlags.Ephemeral});
                break;
            case "view":
                switch(interaction.options.getString("setting")){
                    case "pronouns":
                        text = userData.pronouns ? `Your preferred pronouns are \`${userData.pronouns}\`.` : "You have not set your preferred pronouns.";
                        break;
                }
                return interaction.reply({embeds: [embed.setDescription(text)], flags: MessageFlags.Ephemeral});
                break;
        }

        interaction.client.userData[interaction.user.id] = userData;
        let userDataPath = path.join(process.cwd(), `data/users/${userData.id}.json`);
        fs.writeFileSync(userDataPath, JSON.stringify(userData));
    },
};