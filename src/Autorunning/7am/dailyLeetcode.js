/* src/Autorunning/7am/dailyLeetcode.js
* @fileoverview This file contains the function to execute the daily Leetcode command.
*/

/* Required modules */
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const path = require('path');
const { displayCommands, displayBlueMessage, display_error_message } = require('../../helper/terminal_enhancement');


/* Read the config file for the API URL */
let apiURL;
try {
    const configPath = path.resolve(__dirname, '../../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    apiURL = config.API_DAILY_LEETCODE;
} catch (error) {
    console.error('Error reading config file:', error);
}

async function executeDailyLeetcode(interaction) {
    const maxRetries = 5;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
        try {
            const response = await fetch(apiURL + '/');
            if (!response.ok) {
                display_error_message('Network response was not ok');
            }
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setColor('#6f42c1')
                .setTitle(`Daily Leetcode Problem: ${data.questionTitle}`)
                .setURL(data.questionLink)
                .setDescription(`[Click here to view the problem](${data.questionLink})`)
                .setTimestamp()
                .setFooter({ text: 'Leetcode Daily Problem' })
                .addFields(
                    { name: 'Difficulty', value: data.difficulty, inline: true },
                    { name: 'Problem ID', value: data.questionId, inline: true },
                    { name: 'Paid Only', value: data.isPaidOnly ? 'Yes' : 'No', inline: true },
                )
                .setAuthor({ name: 'Leetcode', iconURL: 'https://leetcode.com/static/images/LeetCode_logo_rvs.png', url: 'https://leetcode.com' })
                .setThumbnail('https://leetcode.com/static/images/LeetCode_logo_rvs.png'); // Thumbnail for visual enhancement

            displayCommands("turn_on_daily_leetcode", interaction, 1);
            displayBlueMessage("Daily Leetcode problem: ", data.questionTitle, "\n\n");
            displayBlueMessage("Link: ", data.questionLink, "\n\n");

            await interaction.reply({ content: '@everyone', embeds: [embed] });

            success = true;
        } catch (error) {
            attempt++;
            if (attempt === maxRetries) {
                display_error_message('Error executing command: ', error);
                await interaction.reply('There was an error while executing this command!');
            } else {
                displayBlueMessage('Error fetching data. Retrying... (Attempt ', `${attempt}/${maxRetries}`, ')');
            }
        }
    }
}

async function dailyLeetcode(client) {
    console.log('Daily Leetcode command executed');
    const channel = client.channels.cache.get(process.env.CHANNEL_LEETCODE_ID);
    if (!channel) {
        console.error('Channel not found!');
        return;
    }
    const fakeInteraction = {
        client,
        commandName: 'turn_on_daily_leetcode',
        channel: channel,
        reply: async (message) => {
            fakeInteraction.channel.send(message);
        }
    };
    try {
        await executeDailyLeetcode(fakeInteraction);
    } catch (error) {
        console.error('Error executing daily Leetcode command:', error);
    }
}

module.exports = { dailyLeetcode };
