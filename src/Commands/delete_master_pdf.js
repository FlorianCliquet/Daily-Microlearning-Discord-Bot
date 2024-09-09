/** src/Commands/delete_master_pdf.js 
  * @fileoverview This file contains the command to delete a master PDF and its associated PDFs.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeMasterPDF, fetchAllMasterPDFs, fetchPDFsByMaster } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');
const { display_error_message, displayCommands, displayBlueMessage } = require('../helper/terminal_enhancement');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemasterpdf')
        .setDescription('Delete a master PDF and its associated PDFs')
        .addStringOption(option =>
            option.setName('pdfname')
                .setDescription('The name of the master PDF to delete')
                .setRequired(true)
                .setAutocomplete(true)),

    // Autocomplete function for PDF names
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const masterPDFs = await fetchAllMasterPDFs(); // Fetch all master PDFs
            const filtered = masterPDFs
                .filter(pdf => pdf.nom.toLowerCase().startsWith(focusedValue.toLowerCase()))
                .slice(0, 25); // Limit results to 25 for better performance
            
            await interaction.respond(
                filtered.map(pdf => ({ name: pdf.nom, value: pdf.nom }))
            );
        } catch (error) {
            display_error_message('Error during autocomplete in deletemasterpdf command:', error);
        }
    },

    // Command execution for deleting the master PDF
    async execute(interaction) {
        const pdfName = interaction.options.getString('pdfname');

        try {
            // Fetch the master PDF and associated PDFs for validation
            const masterPDFs = await fetchAllMasterPDFs();
            const pdfToDelete = masterPDFs.find(pdf => pdf.nom === pdfName);

            // Check if the PDF exists before attempting to delete
            if (!pdfToDelete) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('PDF Not Found')
                    .setDescription(`No PDF found with the name **"${pdfName}"**. Please check the name and try again.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
            }

            // Fetch associated PDFs (if any) before deletion for reporting
            const associatedPDFs = await fetchPDFsByMaster(pdfName);
            const pdfCount = associatedPDFs.length;

            // Proceed with deletion
            const result = await removeMasterPDF(pdfName);
            if (result !== 'success') {
                const failedEmbed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('Deletion Failed')
                    .setDescription(`Failed to delete **"${pdfName}"**. It may have already been removed or an issue occurred.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [failedEmbed], ephemeral: true });
            }

            // Success embed with details of deletion
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for success
                .setTitle('PDF Deleted Successfully')
                .setDescription(`Master PDF **"${pdfName}"** has been deleted from the database.`)
                .addFields(
                    { name: 'Associated PDFs Deleted', value: pdfCount.toString(), inline: true },
                    { name: 'Action', value: 'PDF Deletion', inline: true },
                    { name: 'Status', value: 'Success', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });

            // Log the successful deletion
            displayCommands('deletemasterpdf', interaction.user.tag, 1);
            displayBlueMessage(`PDF "${pdfName}" and ${pdfCount} associated PDFs deleted successfully.`);

        } catch (error) {
            // Log error details for debugging
            display_error_message('Error executing deletemasterpdf command:', error);

            // Inform the user of the error
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for error
                .setTitle('Error')
                .setDescription(`Failed to delete PDF **"${pdfName}"** due to an internal error. Please try again later.`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
