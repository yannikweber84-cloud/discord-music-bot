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

// BOT READY
client.once("ready", () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // =========================
    // PLAY COMMAND
    // =========================
    if (interaction.commandName === "play") {
        let url = interaction.options.getString("url");

        await interaction.deferReply();

        try {
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return interaction.editReply("❌ Du bist in keinem Voice Channel!");
            }

            // Join voice
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            // =========================
            // Spotify Support
            // =========================
            if (url.includes("spotify.com")) {
                const info = await play.spotify(url);
                url = `${info.name} ${info.artists[0].name}`;
            }

            // =========================
            // YouTube Search
            // =========================
            const search = await play.search(url, { limit: 1 });

            if (!search.length) {
                return interaction.editReply("❌ Kein Song gefunden!");
            }

            const streamData = await play.stream(search[0].url);

            const resource = createAudioResource(streamData.stream);

            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply(`🎧 Spiele jetzt: **${search[0].title}**`);

        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Abspielen!");
        }
    }

    // =========================
    // SKIP COMMAND
    // =========================
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

    // =========================
    // STOP COMMAND
    // =========================
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

// LOGIN (WICHTIG!)
client.login(process.env.TOKEN);
