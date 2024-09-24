/* src/Autorunning/4pm/dailyRecap.js
* @fileoverview This file contains the function to execute the daily Leetcode recap command.
*/

/* Required modules */
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { displayCommands, displayBlueMessage, display_error_message } = require('../../helper/terminal_enhancement');
const { fetch_leetcode_accounts } = require('../../database/mongodb');

let apiURL;
let leetcodeurl = "https://leetcode.com/u/";

try {
    const configPath = path.resolve(__dirname, '../../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    apiURL = config.API_LEETCODE_ACCOUNT;
} catch (error) {
    console.error('Error reading config file:', error);
}

async function executeDailyRecap(client) {
    displayCommands("Leetcode Recap");
    const allAccounts = await fetch_leetcode_accounts();
    for (const account of allAccounts) {
        displayBlueMessage('\nProcessing account: ', `${account.Leetcode_account}\n`);
        const maxRetries = 5;
        let attempt = 0;
        let success = false;
        let accountName = account.Leetcode_account;
        let discordUserId = account.Discord_user;

        // Create a unique fakeInteraction for this account
        const channel = client.channels.cache.get(process.env.CHANNEL_LEETCODE_RECAP_ID);
        if (!channel) {
            console.error('Channel not found!');
            return;
        }

        const fakeInteraction = {
            client,
            commandName: 'turn_on_daily_leetcode',
            channel: channel,
            reply: async (message) => {
                await fakeInteraction.channel.send(message);
            }
        };

        while (attempt < maxRetries && !success) {
            try {
                const url = `${apiURL}/${accountName}`;
                const leetcodeUrl = `${leetcodeurl}${accountName}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Determine the start and end of today's date in Unix timestamp format
                const now = new Date();
                const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime() / 1000;
                const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime() / 1000;

                // Filter today's submissions
                const todaySubmissions = data.recentSubmissions.filter(submission => {
                    return submission.timestamp >= startOfDay && submission.timestamp <= endOfDay;
                });
                const submissionCounts = {};

                // Count accepted/rejected submissions per title
                todaySubmissions.forEach(submission => {
                    const { title, statusDisplay, lang } = submission;
                    if (!submissionCounts[title]) {
                        submissionCounts[title] = { accepted: 0, rejected: 0, lang: lang };
                    }

                    if (statusDisplay === 'Accepted') {
                        submissionCounts[title].accepted += 1;
                    } else {
                        submissionCounts[title].rejected += 1;
                    }
                });

                // Create embed for Discord
                const embed = new EmbedBuilder()
                    .setColor('#FF6F00') // A vibrant orange for emphasis
                    .setTitle(`📈 Daily Leetcode Recap for ${accountName}`)
                    .setURL(data.link)
                    .setDescription(`[View your Leetcode profile here](${leetcodeUrl})`)
                    .setThumbnail('https://leetcode.com/static/images/LeetCode_logo_rvs.png') // Thumbnail for visual enhancement
                    .setTimestamp()
                    .setFooter({ text: 'Leetcode Daily Recap', iconURL: 'https://leetcode.com/static/images/LeetCode_logo_rvs.png' });

                // Add Leetcode stats
                embed.addFields(
                    { name: '🗂 Total Problems Solved', value: data.totalSolved.toString(), inline: true },
                    { name: '🟢 Easy Problems Solved', value: data.easySolved.toString(), inline: true },
                    { name: '🟡 Medium Problems Solved', value: data.mediumSolved.toString(), inline: true },
                    { name: '🔴 Hard Problems Solved', value: data.hardSolved.toString(), inline: true },
                    { name: '🏆 Ranking', value: data.ranking.toString(), inline: true },
                    { name: '⭐ Total Contribution Points', value: data.contributionPoint.toString(), inline: true }
                );

                // Add today's submissions
                if (Object.keys(submissionCounts).length > 0) {
                    const recentSubmissions = Object.entries(submissionCounts).map(([title, counts]) => {
                        return `**${title}** (${counts.lang}) - Accepted: ${counts.accepted}, Rejected: ${counts.rejected}`;
                    }).join('\n');

                    embed.addFields({ name: '📚 Today\'s Submissions', value: recentSubmissions, inline: false });
                } else {
                    embed.addFields({ name: '📚 Today\'s Submissions', value: 'No submissions today.', inline: false });
                }

                // Ping the user with the recap
                await fakeInteraction.reply({ content: `<@${discordUserId}>`, embeds: [embed] });
                displayBlueMessage('Daily Leetcode Recap for ', `${accountName}`);
                displayBlueMessage('\nsent to ', `<@${discordUserId}>\n`);
                success = true;
            } catch (error) {
                attempt++;
                if (attempt === maxRetries) {
                    display_error_message('Error executing command: ', error);
                    await fakeInteraction.reply('There was an error while executing this command!');
                } else {
                    displayBlueMessage('Error fetching data. Retrying... (Attempt ', `${attempt}/${maxRetries}`, ')');
                }
            }
        }
    }
}

async function dailyRecap(client) {
    console.log('Daily Leetcode Recap command executed');
    const channel = client.channels.cache.get(process.env.CHANNEL_LEETCODE_RECAP_ID);
    if (!channel) {
        console.error('Channel not found!');                
        return;
    }
    try {
        // Execute the daily recap for the current account
        await executeDailyRecap(client);
    } catch (error) {
        console.error('Error executing daily Leetcode recap command:', error);
    }
}

module.exports = { dailyRecap };
