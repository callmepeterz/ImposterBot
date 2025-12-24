const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption, SlashCommandIntegerOption, ChatInputCommandInteraction, InteractionResponse, EmbedBuilder } = require('discord.js');
const { StarRail, LightCone } = require("starrail.js");

let characterList;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("hsr")
    .setDescription("Retrieves Honkai: Star Rail player information")
    .setNSFW(false)
    .addUserOption(
        new SlashCommandUserOption()
        .setName("user")
        .setDescription("Only available if the user has set their UID. Leave blank for yourself.")
        .setRequired(false)
    )
    .addStringOption(
        new SlashCommandStringOption()
        .setName("uid")
        .setDescription("Honkai: Star Rail UID. Leave blank for your own.")
        .setRequired(false)
        .setMaxLength(9)
    )
    .addIntegerOption(
        new SlashCommandIntegerOption()
        .setName("character")
        .setDescription("Gets details on a player's specific character in their showcase.")
        .setRequired(false)
        .setAutocomplete(true)
        .setMinValue(1001)
        .setMaxValue(9999)
    ),
    index: "",
    isDeferred: true,
    cooldown: 1000,

    /**
     * @param {ChatInputCommandInteraction & {client: { HSR: StarRail } }} interaction 
     * @param {InteractionResponse} deferred
     */
    async execute(interaction, deferred){
        let color = interaction.guild?.members?.me?.displayHexColor || process.env.DEFAULT_COLOR;
        let embed = new EmbedBuilder().setColor(color);
        let uid = interaction.options.getUser("user") ? interaction.options.getString("uid") ?? interaction.client.userData[interaction.options.getUser("user")?.id]?.hsrUid : interaction.options.getString("uid") ?? interaction.client.userData[interaction.user.id]?.hsrUid;
        let characterId = interaction.options.getInteger("character");

        if(!uid) return deferred.edit({embeds: [embed.setDescription("No UID found! If you entered a user, that user hasn't set their UID.\nSpecify a UID, a user, or use `/usersettings hsr` to set your UID.")]});

        try {
            let player = await interaction.client.HSR.fetchUser(uid);
            let characters = await player.getCharacters();

            if(characterId){
                let character = characters.find(c => c.characterData.id === characterId);
                if(!character) return deferred.edit({embeds: [embed.setDescription("Character not found in player's showcase!")]});
                let characterName = character.characterData.id > 8000 ? specialIDs[character.characterData.id] : character.characterData.name.get("en");

                let statString = "";
                character.stats.overallStats.getAll().forEach(s => statString += `${s.statProperty.name.get("en")}: ${s.valueText}\n`);

                let relicsString = "";
                character.relics.forEach(r => relicsString += `${r.relicData.name.get("en")} (Lv. ${r.level})\n`);

                embed
                .setAuthor({name: player.nickname.slice(0, 256), iconURL: player.icon.icon.url})
                .setTitle(`${characterName} (Lv. ${character.level} - E${character.eidolons}S${character.lightCone?.superimposition?.level ?? 0})`.slice(0, 256))
                .setThumbnail(character.characterData.icon.url)
                .setDescription(statString)
                .addFields(
                    {name: "Light cone", value: character.lightCone ? `${character.lightCone.lightConeData.name.get("en")} (Lv. ${character.lightCone.level} - Superimposition ${character.lightCone.superimposition.level})` : "None"},
                    {name: "Relics", value: relicsString.slice(0, 1024) || "None"}
                )
                .setFooter({text: `UID: ${player.uid ?? "Not available"}`});
            }
            else {
                let showcaseCharacters = "";

                characters.forEach(c => showcaseCharacters += `${c.characterData.id > 8000 ? specialIDs[c.characterData.id] : c.characterData.name.get("en")} (Lv. ${c.level} - E${c.eidolons}S${c.lightCone?.superimposition?.level ?? 0})\n`);

                embed
                .setTitle(player.nickname.slice(0, 256))
                .setThumbnail(player.icon.icon.url)
                .setDescription(player.signature?.slice(0, 4000) ?? null)
                .addFields(
                    {name: "Server", value: serverPrefix[uid.at(0)], inline: true},
                    {name: "Trailblaze level", value: player.level.toString(), inline: true},
                    {name: "Equilibrium level", value: player.equilibriumLevel.toString(), inline: true},
                    {name: "Friends", value: player.friends.toString(), inline: true},
                    {name: "Characters", value: player.characterCount.toString(), inline: true},
                    {name: "Light cones", value: player.lightConeCount.toString(), inline: true},
                    {name: "Relics", value: player.relicCount.toString(), inline: true},
                    {name: "Achievements", value: player.achievementCount.toString(), inline: true},
                    {name: "Showcase characters", value: showcaseCharacters || "None"}
                )
                .setFooter({text: `UID: ${player.uid ?? "Not available"}`});
            }
            deferred.edit({embeds: [embed]});
        }
        catch (error) {
            deferred.edit({embeds: [embed.setDescription(`Encountered an error!\n\`\`\`\n${error?.toString()?.slice(0,2000)}\n\`\`\``)]});
        }
    },

    
    /**
     * @param {AutocompleteInteraction & {client: { HSR: StarRail }} interaction 
     */
    async autocomplete(interaction) {
        if(!characterList) characterList = interaction.client.HSR.getAllCharacters(true).map(c => {
            let name = c.id > 8000 ? specialIDs[c.id] : c.name.get("en")
            return {name, value: c.id}
        });

        const focusedValue = interaction.options.getFocused();
        const filtered = characterList.filter(m=>m.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25);
        
		await interaction.respond(filtered);
	},
};

let specialIDs = {
    8001: "Destruction Trailblazer - Male",
    8002: "Destruction Trailblazer - Female",
    8003: "Preservation Trailblazer - Male",
    8004: "Preservation Trailblazer - Female",
    8005: "Harmony Trailblazer - Male",
    8006: "Harmony Trailblazer - Female",
    8007: "Remembrance Trailblazer - Male",
    8008: "Remembrance Trailblazer - Female",
}

let serverPrefix = {
    "0": "Internal miHoYo server",
    "1": "Mainland China",
    "2": "Mainland China",
    "6": "America",
    "7": "Europe",
    "8": "Asia",
    "9": "TW, HK, MO"
}