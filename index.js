const { Client, GatewayIntentBits } = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior
} = require("@discordjs/voice");

const play = require("play-dl");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
    }
});

let connection = null;

client.once("ready", () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

// =====================
// SLASH COMMANDS
// =====================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // =====================
    // PLAY
    // =====================
    if (interaction.commandName === "play") {
        let query = interaction.options.getString("url");

        await interaction.deferReply();

        try {
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.editReply("❌ Du bist in keinem Voice Channel!");
            }

            // Join Voice
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            // =====================
            // Spotify FIX (nur Text nutzen)
            // =====================
            if (query.includes("spotify.com")) {
                try {
                    const info = await play.spotify(query);
                    query = `${info.name} ${info.artists?.[0]?.name || ""}`;
                } catch {
                    return interaction.editReply("❌ Spotify konnte nicht verarbeitet werden!");
                }
            }

            // =====================
            // YOUTUBE SEARCH (STABIL)
            // =====================
            const search = await play.search(query, {
                limit: 1,
                source: { youtube: "video" }
            });

            if (!search || search.length === 0) {
                return interaction.editReply("❌ Kein Song gefunden!");
            }

            const video = search[0];

            const streamData = await play.stream(video.url);

            const resource = createAudioResource(streamData.stream);

            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply(`🎧 Spiele jetzt: **${video.title}**`);

        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Abspielen!");
        }
    }

    // =====================
    // SKIP
    // =====================
    if (interaction.commandName === "skip") {
        await interaction.deferReply();

        try {
            player.stop();
            await interaction.editReply("⏭ Song übersprungen!");
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Skip!");
        }
    }

    // =====================
    // STOP
    // =====================
    if (interaction.commandName === "stop") {
        await interaction.deferReply();

        try {
            player.stop();

            if (connection) {
                connection.destroy();
                connection = null;
            }

            await interaction.editReply("⏹ Musik gestoppt!");
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Stop!");
        }
    }
});

// =====================
// LOGIN
// =====================
client.login(process.env.TOKEN);
