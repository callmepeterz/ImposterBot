const { SlashCommandBuilder, ChatInputCommandInteraction, InteractionResponse, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getServerStatus } = require("../util/minecraftProtocol.js");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("mc")
    .setDescription("Shows information about the Minecraft server")
    .setNSFW(false),
    index: "",
    isDeferred: true,
    cooldown: 5000,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {InteractionResponse} deferred
     */
    async execute(interaction, deferred, attempt=0){
        attempt++;
        let color = interaction.guild?.members?.me?.displayHexColor || process.env.DEFAULT_COLOR;
        let embed = new EmbedBuilder().setColor(color);
      
        try {
            let response = await getServerStatus(process.env.MINECRAFT_SERVER_ADDRESS, parseInt(process.env.MINECRAFT_SERVER_PORT));
            embed
            .setDescription(`\`\`\`js\n${process.env.MINECRAFT_SERVER_ADDRESS}:${process.env.MINECRAFT_SERVER_PORT}\n\`\`\`${getMotdText(response.description).slice(0, 1000)}`)
            .setThumbnail("attachment://icon.png")
            .addFields({name: "Status", value: response.version.protocol !== -1 ? "Online" : response.version.name.replaceAll(/§./g, "").replaceAll("●", "").replaceAll("◌", ""), inline: true});
            if(response.version.protocol !== -1) embed.addFields({name: "Version", value: response.version.name, inline: true});
            embed.addFields({name: "Players", value: `${response.players.online}/${response.players.max}`, inline: true});
            if(response.players?.sample?.length) embed.addFields({name: "Players online", value: `\`\`\`\n${getPlayerList(response.players.sample).slice(0, 1000)}\n\`\`\``});

            if(attempt > 1) embed.setFooter({text: `Attempt ${attempt}`});

            const iconAttachment = new AttachmentBuilder(Buffer.from(response.favicon.split(",")[1], "base64"), {name: "icon.png"});
            deferred.edit({embeds: [embed], files: [iconAttachment]});
        }
        catch (error) {
            if(attempt < parseInt(process.env.MINECRAFT_SERVER_MAX_ATTEMPT)) {
                setTimeout(()=>this.execute(interaction, deferred, attempt), parseInt(process.env.MINECRAFT_SERVER_ATTEMPT_TIMEOUT));
                return;
            }
            deferred.edit({embeds: [embed.setDescription(`Encountered an error!\n\`\`\`\n${error?.toString()?.slice(0,2000)}\n\`\`\``)]});
        }
    },
};

function getMotdText(description){
    let extra = ""
    for(e of description.extra){
        extra += e?.text ?? "";
    }
    return description.text || extra || "";
}

function getPlayerList(sample){
    let list = "";
    for(p of sample){
        list += p.name + "\n";
    }
    return list;
}
