/** main.js
 * @fileoverview This file is the entry point of the application.
 * It initializes the discord client and sets up thr routes for the commands and major variables.
 */

/* Required modules */
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { handle_AutoRunning_funcion } = require('./src/Autorunning/handle_AutoRunning_funcion');
const { display_header, displayConnectionStatus, display_error_message } = require('./src/helper/terminal_enhancement');

/* Client Initialization */
const client = new Client({
    /* Intents are used to delimited the client action*/
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions
    ],
    /* Partials are used to get the full message content */
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

/* Set the commands property on the client */
client.commands = new Collection();
client.dailyPDFActive = ('true'); // 'true' : you want to send the daily PDF to a given channel (env variable) : false otherwise
client.dailyLeetcodeActive = ('true'); // 'true' : you want to send the daily Leetcode to a given channel (env variable) : false otherwise
client.dailyLeetcodeRecapActive = ('true'); // 'true' : you want to send the daily Leetcode Recap to a given channel (env variable) : false otherwise

/* Read the command files */
const commandsPath = path.join(__dirname, 'src/Commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

/* Loop through the command files */
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require (filePath);
    client.commands.set(command.data.name, command);
}

/* When the client is ready, init it */
client.once('ready', () => {
    display_header();
    displayConnectionStatus(client);
    handle_AutoRunning_funcion(client);
});

/* When the client receives an interaction, execute the command */
client.on('interactionCreate', async interaction => {
    console.log('Interaction received');
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error('Command not found for autocomplete:', interaction.commandName);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error('Error during autocomplete interaction:', error);
        }
        return;
    }

    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error('Command not found:', interaction.commandName);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error during command execution:', error);
        display_error_message('An error occurred while trying to execute the command:', error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});


/* Login the client */
/* The loginWithRetry is meant to handle the case where the client is unable to login due to a DNS resolution error */ 
const loginWithRetry = async (client, token, retries = 10, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await client.login(token);
            return;
        } catch (error) {
            if (error.code === 'EAI_AGAIN') {
                display_error_message('DNS resolution error. Retrying...');
            } else {
                display_error_message(`Login attempt ${i + 1} failed: ${error.message}`);
            }
            if (i === retries - 1) {
                display_error_message('Failed to login after multiple attempts', error);
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

loginWithRetry(client, process.env.DISCORD_TOKEN);