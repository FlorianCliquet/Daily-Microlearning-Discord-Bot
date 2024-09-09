/* src/Commands/delete_pdf.js
* @fileoverview This file contains the command to delete a PDF from a master PDF.
*/

/* Required modules */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchAllMasterPDFs, fetchPDFsByMaster, removePDF } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletepdf')
        .setDescription('Delete a PDF from a master PDF')
        .addStringOption(option =>
            option.setName('masterpdf')
                .setDescription('Select the master PDF')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('pdfname')
                .setDescription('Select the PDF to delete')
                .setRequired(true)
                .setAutocomplete(true)),

    // Auto-complete logic for master PDF
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'masterpdf') {
            const masterPDFs = await fetchAllMasterPDFs();
            await interaction.respond(
                masterPDFs.map(pdf => ({ name: pdf.nom, value: pdf.nom }))
            );
        } else if (focusedOption.name === 'pdfname') {
            const masterPDF = interaction.options.getString('masterpdf');
            const pdfs = await fetchPDFsByMaster(masterPDF);
            await interaction.respond(
                pdfs.map(pdf => ({ name: pdf.nom, value: pdf.nom }))
            );
        }
    },

    async execute(interaction) {
        const masterPDF = interaction.options.getString('masterpdf');
        const pdfName = interaction.options.getString('pdfname');

        try {
            // Fetch PDFs for the selected master PDF
            const pdfs = await fetchPDFsByMaster(masterPDF);
            const pdfToDelete = pdfs.find(pdf => pdf.nom === pdfName);

            if (!pdfToDelete) {
                return interaction.reply({ content: `PDF "${pdfName}" not found in "${masterPDF}".`, ephemeral: true });
            }

            // Delete PDF from the database
            await removePDF(masterPDF, pdfName);

            // Success Embed
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green for success
                .setTitle('PDF Deleted Successfully')
                .setDescription(`PDF **"${pdfName}"** has been deleted from master PDF **"${masterPDF}"**.`)
                .setTimestamp()
                .setFooter({ text: `Deleted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red for error
                .setTitle('Error Deleting PDF')
                .setDescription(`Failed to delete the PDF: ${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
