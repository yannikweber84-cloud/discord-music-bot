const { Client, GatewayIntentBits, Collection } = require("discord.js");
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

// Player
const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
    }
});

let connection = null;

// READY
client.once("ready", () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

// SLASH COMMANDS
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ======================
    // PLAY
    // ======================
    if (interaction.commandName === "play") {
        const url = interaction.options.getString("url");

        if (!url) {
            return interaction.reply("❌ Keine URL angegeben!");
        }

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

            // Stream
            const streamData = await play.stream(url);

            const resource = createAudioResource(streamData.stream);

            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply(`🎧 Spiele jetzt: ${url}`);

        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Fehler beim Abspielen!");
        }
    }

    // ======================
    // SKIP
    // ======================
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

    // ======================
    // STOP
    // ======================
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

// LOGIN (WICHTIG: ENV VAR)
client.login(process.env.TOKEN); 
