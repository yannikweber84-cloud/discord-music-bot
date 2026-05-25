const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1508380504016027668';
const GUILD_ID = '1507455362360545532';

const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt Musik ab')
        .addStringOption(opt =>
            opt.setName('url')
                .setDescription('YouTube Link')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den Song'),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stoppt Musik und verlässt Voice')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );

    console.log('Commands registriert 🎧');
})();