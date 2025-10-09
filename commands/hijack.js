const { SlashCommandBuilder, SlashCommandUserOption, ChatInputCommandInteraction, InteractionResponse, EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const get = require("../util/httpsGet.js");
const fs = require("node:fs");
const path = require("node:path");

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

        botMember?.setNickname(targetMember.nickname ?? target.displayName).catch(()=>{});
        botRole?.setColors({primaryColor: targetMember.displayColor})//.catch(()=>{});
        botRole?.setName(targetRole?.name).catch(()=>{});

        let color = targetMember.displayHexColor || process.env.DEFAULT_COLOR;
        let embed = new EmbedBuilder().setColor(color);
       
        if(Date.now() - interaction.client.lastHijacked < process.env.HIJACK_COOLDOWN) return interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}> (Profile pic change on cooldown.)`)], flags: MessageFlags.Ephemeral});
        
        let pfpURL = target.avatarURL({ size: 1024 });
        if(!pfpURL) return interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}> (No profile pic.)`)], flags: MessageFlags.Ephemeral});
        let pfpData = await get(pfpURL);
        interaction.client.user.setAvatar(Buffer.concat(pfpData)).catch(()=>{});
        interaction.client.user.setUsername(target.username);
        interaction.reply({embeds:[embed.setDescription(`Hijacked <@${target.id}>`)], flags: MessageFlags.Ephemeral});

        let contents = [
            {
                inlineData: {
                    mimeType: "image/png",
                    data: Buffer.concat(pfpData).toString("base64"),
                },
            },
            {
                text: "This is a system intitialization event. The attached image is your current profile picture. Give a detailed but concise description, as detailed as possible, for your future self, not the user, including any inside jokes or people you know if detected, for the profile picture, obeying the usual rules for responses of such command (no emojis, only use characters allowed, max length, no mentions, etc.).",
                role: "model"
            }
        ];

        const response = await interaction.client.ai[1].models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                systemInstruction: interaction.client.aiContext.systemInstruction,
                temperature: 0.8
            }
        }).catch(err=>console.error(err));

        interaction.client.profilepic.description = response?.text;
        interaction.client.profilepic.user = target.id;
        fs.writeFileSync(path.join(process.cwd(), "data/bot/profilepic.txt"), interaction.client.profilepic.description);
        fs.writeFileSync(path.join(process.cwd(), "data/bot/impersonated.txt"), interaction.client.profilepic.user);
        console.log("Profile picture detected: " + interaction.client.profilepic.description);
    },
};