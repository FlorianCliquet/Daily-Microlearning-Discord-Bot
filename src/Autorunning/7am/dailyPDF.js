/* src/Autorunning/7am/dailyPDF.js
* @fileoverview This file contains the function to execute the daily PDF command.
*/

/* Required modules */
const { fetchAllMasterPDFs, fetchPDFsByMaster, fetchIndexes, resetPDFIndex, updateMasterPDFIndex} = require('../../database/mongodb');
const { EmbedBuilder } = require('discord.js');
const { displayCommands, displayBlueMessage, display_error_message } = require('../../helper/terminal_enhancement');

async function generatePDFEmbed(interaction, pdf, masterPDF_name) {
    try {
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('Daily PDF - ' + masterPDF_name)
            .setDescription(`The daily PDF is: **${pdf.nom}**`)
            .addFields({ name: 'Link', value: `[Click here to view](${pdf.link})`, inline: false })
            .setTimestamp()
            .setFooter({ text: 'Daily PDF Command', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' })
            .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png');
    
        // Log the command usage
        displayCommands("Daily PDF", interaction, 1);
        const now = new Date();
        displayBlueMessage("The commands were executed at: ", now, "");
        displayBlueMessage("The daily PDF is: ", pdf.name, "\n\n");
        await interaction.reply({ content: '@everyone', embeds: [embed] });
    } catch (error) {
        display_error_message('Error generating PDF embed: ', error);
    }
}

async function dailyPDF(client) {
    const channel = client.channels.cache.get(process.env.CHANNEL_PDF_ID);
    if (!channel) {
        console.error('Channel not found!');
        return;
    }
    try {
        let pdfIndex = 0;
        let pdfs = [];
        let masterPDF_name = '';
        let masterDataIndex = 0;
        let pdf = {};
        const masterData = await fetchAllMasterPDFs();
        const indexes = await fetchIndexes();
        masterDataIndex = indexes[0].MasterPDFIndex;
        pdfIndex = indexes[0].PDFIndex;
        masterPDF_name = masterData[masterDataIndex % masterData.length].nom;
        pdfs = await fetchPDFsByMaster(masterPDF_name);
        if (pdfIndex >= pdfs.length) {
            await updateMasterPDFIndex();
            pdfIndex = 0;
            masterDataIndex++;
            masterPDF_name = masterData[masterDataIndex % masterData.length].nom;
            pdfs = await fetchPDFsByMaster(masterPDF_name);
        }
        if (pdfs.length === 0) {
            const fakeInteraction = {
                client,
                commandName: 'dailyPDF',
                channel: channel,
                reply: async (message) => {
                    fakeInteraction.channel.send(message);
                }
            };
            const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('No PDFs Found')
            .setDescription('No PDFs found in the database.')
            .setTimestamp()
            .setFooter({ 
                text: 'Daily PDF Command', 
                iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' 
            });
            await fakeInteraction.reply({ content: '@everyone', embeds: [embed] })
            return;
        }
        pdf = pdfs[pdfIndex];
        const fakeInteraction = {
            client,
            commandName: 'dailyPDF',
            channel: channel,
            reply: async (message) => {
                fakeInteraction.channel.send(message);
            }
        };
        await generatePDFEmbed(fakeInteraction, pdf, masterPDF_name);
    } catch (error) {
        display_error_message('Error generating PDF: ', error);
    }
}

module.exports = {dailyPDF};

