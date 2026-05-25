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

// =========================
// READY
// =========================
client.once("ready", () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // =========================
    // PLAY
    // =========================
    if (interaction.commandName === "play") {
        let query = interaction.options.getString("url");

        await interaction.deferReply();

        try {
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.editReply("❌ Du bist in keinem Voice Channel!");
            }

            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            let video = null;

            // =========================
            // YouTube Link
            // =========================
            if (query.includes("youtu")) {
                video = await play.video_info(query);
                video = video.video_details;
            }

            // =========================
            // Spotify → Text
            // =========================
            else if (query.includes("spotify.com")) {
                try {
                    const sp = await play.spotify(query);
                    query = `${sp.name} ${sp.artists?.[0]?.name || ""}`;
                } catch {
                    return interaction.editReply("❌ Spotify konnte nicht gelesen werden!");
                }
            }

            // =========================
            // YouTube Search
            // =========================
            if (!video) {
                const search = await play.search(query, { limit: 1 });

                if (!search || search.length === 0) {
                    return interaction.editReply("❌ Kein Song gefunden!");
                }

                video = search[0];
            }

            // =========================
            // STREAM
            // =========================
            const streamData = await play.stream(video.url);

            const resource = createAudioResource(streamData.stream);

            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply(`🎧 Jetzt spielt: **${video.title}**`);

        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Abspielen!");
        }
    }

    // =========================
    // SKIP
    // =========================
    if (interaction.commandName === "skip") {
        await interaction.deferReply();

        try {
            player.stop();
            await interaction.editReply("⏭ Übersprungen!");
        } catch {
            await interaction.editReply("❌ Fehler beim Skip!");
        }
    }

    // =========================
    // STOP
    // =========================
    if (interaction.commandName === "stop") {
        await interaction.deferReply();

        try {
            player.stop();

            if (connection) {
                connection.destroy();
                connection = null;
            }

            await interaction.editReply("⏹ Gestoppt!");
        } catch {
            await interaction.editReply("❌ Fehler beim Stop!");
        }
    }
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
