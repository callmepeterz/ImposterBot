const { SlashCommandBuilder, SlashCommandUserOption, ChatInputCommandInteraction, InteractionResponse, EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const get = require("../util/httpsGet.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("hijack")
    .setDescription("Commits identity theft against a user")
    .setNSFW(false)
    .addUserOption(
        new SlashCommandUserOption()
        .setName("target")
        .setDescription("User to hijack")
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild),
    index: "",
    isDeferred: false,
    cooldown: 10000,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {InteractionResponse} deferred
     */
    async execute(interaction, deferred){
        let target = interaction.options.getUser("target");
        let targetMember = interaction.guild.members.cache.get(target.id);
        let targetRole = targetMember?.roles?.highest;
        let botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        let botRole = interaction.guild.roles.cache.get(process.env.ROLE_ID);

        botMember?.setNickname(targetMember.nickname).catch(()=>{});
        botRole?.setColors({primaryColor: targetMember.displayColor})//.catch(()=>{});
        botRole?.setName(targetRole?.name).catch(()=>{});

        let color = targetMember.displayHexColor || process.env.DEFAULT_COLOR;
        let embed = new EmbedBuilder().setColor(color);
       
        if(Date.now() - interaction.client.lastHijacked < process.env.HIJACK_COOLDOWN) return interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}> (Profile pic change on cooldown.)`)], flags: MessageFlags.Ephemeral});
        
        let pfpURL = target.avatarURL();
        if(!pfpURL) return interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}> (No profile pic.)`)], flags: MessageFlags.Ephemeral});
        let pfpData = await get(pfpURL);
        interaction.client.user.setAvatar(Buffer.concat(pfpData)).catch(()=>{});
        interaction.client.user.setUsername(target.username);
        interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}>`)], flags: MessageFlags.Ephemeral});
    },
};