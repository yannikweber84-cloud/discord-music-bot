const { Client, GatewayIntentBits } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection
} = require('@discordjs/voice');

const play = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const player = createAudioPlayer();

client.once('ready', () => {
    console.log(`✅ Bot online als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // 🎵 PLAY
    if (interaction.commandName === 'play') {
        await interaction.deferReply(); // 🔥 wichtig gegen "Anwendung reagiert nicht"

        const url = interaction.options.getString('url');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.editReply('❌ Du musst in einem Voice Channel sein!');
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            const stream = await play.stream(url);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply(`🎧 Spiele jetzt: ${url}`);
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fehler beim Abspielen!');
        }
    }

    // ⏭ SKIP
    if (interaction.commandName === 'skip') {
        await interaction.deferReply();

        try {
            player.stop();
            await interaction.editReply('⏭ Song übersprungen!');
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fehler beim Skip!');
        }
    }

    // ⏹ STOP
    if (interaction.commandName === 'stop') {
        await interaction.deferReply();

        try {
            player.stop();

            const connection = getVoiceConnection(interaction.guild.id);
            if (connection) connection.destroy();

            await interaction.editReply('⏹ Musik gestoppt und Voice verlassen!');
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Fehler beim Stop!');
        }
    }
});

client.login(process.env.TOKEN);