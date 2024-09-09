/* src/Commands/show_pdf.js
* @fileoverview This file contains the command to show the database contents.
*/

/* Required modules */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { fetchPDFsByMaster, fetchAllMasterPDFs } = require('../database/mongodb');
const { displayBlueMessage, display_error_message, displayCommands } = require('../helper/terminal_enhancement');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_pdf')
        .setDescription('Show the database contents'),
    
    async execute(interaction) {
        try {
            // Fetch all master PDFs from the database
            const masterData = await fetchAllMasterPDFs();
            console.log('masterData', masterData);

            if (!masterData || masterData.length === 0) {
                // No master PDFs found, send an informative message
                const noPDFEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Database Contents')
                    .setDescription('No PDFs found in the database.')
                    .setTimestamp();
                
                displayCommands("show_pdf", interaction.user.tag, 0);
                displayBlueMessage("No PDFs found in the database.\n\n");

                await interaction.reply({ embeds: [noPDFEmbed], ephemeral: true });
                return;
            }

            // Fetch PDFs for each master in parallel
            /* pdfMasterData is an array of objects, each containing the master name and an array of PDFs */
            /* the structure of pdfMasterData is [{ name: 'Master Name', pdfs: [{ nom: 'PDF Name', link: 'PDF Link' }] }] */
            const pdfData = await Promise.all(masterData.map(async (master) => {
                try {
                    const pdfs = await fetchPDFsByMaster(master.nom);
                    return { name: master.nom, pdfs: pdfs || [] }; // Ensure pdfs is always an array
                } catch (err) {
                    console.error(`Error fetching PDFs for master: ${master.nom}`, err);
                    return { name: master.nom, pdfs: [] };  // Return empty array if there's an error
                }
            }));

            if (pdfData.every(master => master.pdfs.length === 0)) {
                // If all masters have no PDFs, send an informative message
                const noPDFEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Database Contents')
                    .setDescription('No PDFs found in the database.')
                    .setTimestamp();
                
                displayCommands("show_pdf", interaction.user.tag, 0);
                displayBlueMessage("No PDFs found in the database.\n\n");

                await interaction.reply({ embeds: [noPDFEmbed], ephemeral: true });
                return;
            }

            // Pagination constants
            const ITEMS_PER_PAGE = 1;  // Adjust as needed
            const FIELDS_PER_PAGE = 5; // Number of fields per page (adjust as needed)
            const totalPages = Math.ceil(pdfData.filter(master => master.pdfs.length > 0).length / ITEMS_PER_PAGE); // Filter out empty pdfs before calculating total pages

            // Helper function to generate the embed for each page
            const generateEmbed = (page) => {
                const start = page * ITEMS_PER_PAGE;
                const end = Math.min(start + ITEMS_PER_PAGE, pdfData.length);
                const currentItems = pdfData.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('Database Contents')
                    .setDescription('The database contains the following PDFs:')
                    .setTimestamp()
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

                currentItems.forEach(master => {
                    if (master.pdfs.length > 0) {
                        // Split the list of PDFs into multiple fields if necessary
                        let pdfList = master.pdfs.map(pdf => `${pdf.nom} - [Link](${pdf.link})`);
                        while (pdfList.length > 0) {
                            const chunk = pdfList.splice(0, FIELDS_PER_PAGE);
                            embed.addFields({ name: master.name, value: chunk.join('\n') });
                        }
                    }
                });

                return embed;
            };

            let currentPage = 0;
            const embedMessage = await interaction.reply({ embeds: [generateEmbed(currentPage)], fetchReply: true });

            if (totalPages > 1) {
                // Add reaction emojis for pagination
                await embedMessage.react('⬅️');
                await embedMessage.react('➡️');

                // Filter for valid reactions
                const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
                const collector = embedMessage.createReactionCollector({ filter, time: 60000 });

                collector.on('collect', (reaction, user) => {
                    reaction.users.remove(user);

                    if (reaction.emoji.name === '➡️') {
                        currentPage = (currentPage + 1) % totalPages; // Go to the next page
                    } else if (reaction.emoji.name === '⬅️') {
                        currentPage = (currentPage - 1 + totalPages) % totalPages; // Go to the previous page
                    }

                    // Edit the embed to show the new page
                    embedMessage.edit({ embeds: [generateEmbed(currentPage)] }).catch(console.error);
                });

                collector.on('end', () => {
                    embedMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                });
            }

            displayCommands("show_pdf", interaction.user.tag, 1);
            displayBlueMessage(`Database content displayed successfully. ${totalPages} page(s).\n\n`);

        } catch (error) {
            // Log and handle any unexpected errors
            console.error('Error executing show_pdf command: ', error);
            display_error_message('Error executing show_pdf command: ', error);

            if (!interaction.replied && !interaction.deferred) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('Error fetching data from the database. Please try again later.')
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
