/** src/Autorunning/7am/dailyLeetcode.js
 * @fileoverview This file contains the function to execute the daily Microlearning command.
 */

/* Required modules */
const { EmbedBuilder } = require('discord.js');
const { displayCommands, displayBlueMessage, display_error_message } = require('../../helper/terminal_enhancement');
const { fetchMicrolearningData, getMicrolearningIndex } = require('../../database/mongodb');

async function executeDailyMicrolearning(interaction, microlearning) {
    try {
        if (!microlearning || !microlearning.title || !microlearning.description || !microlearning.article) {
            throw new Error('Microlearning data is missing required fields');
        }

        // Log microlearning data
        console.log('Microlearning:', microlearning);
        console.log('Microlearning title:', microlearning.title);
        console.log('Microlearning description:', microlearning.description);
        console.log('Microlearning article:', microlearning.article);

        // Check if the article URL is valid
        let url = microlearning.article;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            console.warn('Invalid URL format detected. Prepending "https://".');
            url = `https://${url}.com`;
        }

        console.log('Final URL:', url);

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#6f42c1')
            .setTitle(`Daily Microlearning: ${microlearning.title}`)
            .setDescription(microlearning.description.length > 2048 ? microlearning.description.slice(0, 2045) + '...' : microlearning.description)
            .setURL(url)
            .setTimestamp()
            .setFooter({ text: 'Microlearning Daily' });

        // Log the command usage
        displayCommands("Daily Microlearning", interaction, 1);
        const now = new Date();
        displayBlueMessage("The commands were executed at: ", now, "");
        displayBlueMessage("The daily Microlearning is: ", microlearning.title, "\n\n");

        await interaction.reply({ content: '@everyone', embeds: [embed] });
    } catch (error) {
        console.error('Error generating Microlearning embed:', error);
        display_error_message('Error generating Microlearning embed:', error.message || error);
    }
}

async function dailyMicroLearning(client) {
    console.log('Daily Microlearning command executed');
    const channel = client.channels.cache.get(process.env.CHANNEL_MICROLEANRING_ID);
    if (!channel) {
        console.error('Channel not found!');
        return;
    }

    const fakeInteraction = {
        client,
        commandName: 'dailyMicroLearning',
        channel: channel,
        reply: async (message) => {
            await fakeInteraction.channel.send(message);
        }
    };

    try {
        const microlearning_data = await fetchMicrolearningData();
        const index = await getMicrolearningIndex(); // Ensure this returns a valid index
        console.log('Microlearning Index:', index);

        if (microlearning_data.length === 0) {
            throw new Error('No microlearning data found');
        }

        const microlearning = microlearning_data[index % microlearning_data.length];
        console.log('Microlearning:', microlearning);

        if (!microlearning || !microlearning.title || !microlearning.description || !microlearning.article) {
            throw new Error('Microlearning data is missing required fields');
        }

        await executeDailyMicrolearning(fakeInteraction, microlearning);
    } catch (error) {
        console.error('Error executing daily Microlearning command:', error);
        display_error_message('Error executing daily Microlearning command:', error.message || error);
    }
}

module.exports = { dailyMicroLearning };
