const { Client, GatewayIntentBits } = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
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

// ===================== READY =====================
client.once("ready", () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

// ===================== INTERACTIONS =====================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ===================== PLAY =====================
    if (interaction.commandName === "play") {

        await interaction.deferReply(); // wichtig gegen Timeout

        try {
            let query = interaction.options.getString("url");

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

            // =====================
            // YouTube Link direkt
            // =====================
            if (query.includes("youtu")) {
                const info = await play.video_info(query);
                video = info.video_details;
            }

            // =====================
            // Spotify FIX (KEIN API CALL!)
            // =====================
            else if (query.includes("spotify.com")) {
                const parts = query.split("/track/");
                const id = parts[1]?.split("?")[0];

                query = `song ${id}`;
            }

            // =====================
            // SEARCH (YouTube safe)
            // =====================
            if (!video) {
                const search = await play.search(query, { limit: 1 });

                if (!search || search.length === 0) {
                    return interaction.editReply("❌ Kein Song gefunden!");
                }

                video = search[0];
            }

            // =====================
            // STREAM
            // =====================
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

    // ===================== SKIP =====================
    if (interaction.commandName === "skip") {
        await interaction.deferReply();

        try {
            player.stop();
            await interaction.editReply("⏭ Übersprungen!");
        } catch {
            await interaction.editReply("❌ Fehler beim Skip!");
        }
    }

    // ===================== STOP =====================
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

// ===================== LOGIN =====================
client.login(process.env.TOKEN);
