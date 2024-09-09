/** src/database/mongodb.js
 * @fileoverview This file contains the functions that are used to connect to the MongoDB database.
 */

/* Required modules */
const { MongoClient, ServerApiVersion } = require('mongodb');
const { display_error_message } = require('../helper/terminal_enhancement');
const dotenv = require('dotenv');
const path = require('path');

/* Load the environment variables */
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/* Setup the MongoDB Client */
const url = process.env.MONGODB_URL;
if (!url) {
    display_error_message('The MongoDB URL is not set in the environment variables.');
    process.exit(1);
}
let database_name = process.env.MONGODB_DATABASE_NAME;
if (!database_name) {
    display_error_message('The MongoDB database name is not set in the environment variables.');
    process.exit(1);
}
let master_collection_name = process.env.MONGODB_MASTER_COLLECTION_NAME;
if (!master_collection_name) {
    display_error_message('The MongoDB master collection name is not set in the environment variables.');
    process.exit(1);
}
let pdf_collection_name = process.env.MONGODB_PDF_COLLECTION_NAME;
if (!pdf_collection_name) {
    display_error_message('The MongoDB PDF collection name is not set in the environment variables.');
    process.exit(1);
}
let leetcode_collection_name = process.env.MONGODB_LEETCODE_COLLECTION_NAME;
if (!leetcode_collection_name) {
    display_error_message('The MongoDB Leetcode collection name is not set in the environment variables.');
    process.exit(1);
}
let index_collection_name = process.env.MONGODB_INDEX_COLLECTION_NAME;
if (!index_collection_name) {
    display_error_message('The MongoDB index collection name is not set in the environment variables.');
    process.exit(1);
}
let microlearning_collection_name = process.env.MONGODB_MICROLEARNING_COLLECTION_NAME;
if (!microlearning_collection_name) {
    display_error_message('The MongoDB microlearning collection name is not set in the environment variables.');
    process.exit(1);
}
let client; // Declare client outside to be reused

/**
 * Get the connected MongoDB client
 * @returns {Promise<MongoClient>} The connected MongoDB client
 */
async function getMongoClient() {
    if (!client) {
        client = new MongoClient(url, { 
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
                serverSelectionTimeoutMS: 30000, // 30 seconds
            }
        });
        await client.connect();
        console.log('Connected to the MongoDB database');
    }
    return client;
}

/**
 * Disconnect from MongoDB (optional, can be used during application shutdown)
 */
async function disconnectFromMongoDB() {
    if (client) {
        await client.close();
        client = null;
        console.log('Disconnected from the MongoDB database');
    }
}

/* 
====================================================== DAILY PDF FUNCTIONS ========================================================== */

/* ====================PDF MASTER RELATED FUNCTIONS==================== */

/** 
 * Fetches all Master PDFs from the masterpdf collection database.
 * @returns {Array} - An array of all the master PDFs.
 */
async function fetchAllMasterPDFs() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(master_collection_name);
        const masterPDFs = await collection.find().toArray();
        return masterPDFs;
    } catch (error) {
        display_error_message('Error fetching all Master PDFs.', error);
        throw error;
    }
}

/**
 * Add a Master PDF to the masterpdf collection database.
 * @param {string} nom - The name of the Master PDF.
 */
async function addMasterPDF(nom) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(master_collection_name);

        const existingMasterPDF = await collection.findOne({ nom: nom });
        if (existingMasterPDF) {
            return null;
        }
        const last_index = await collection.find().sort({ index: -1 }).limit(1).toArray();
        const newIndex = (last_index.length > 0) ? last_index[0].index + 1 : 0;
        await collection.insertOne({ nom: nom, index: newIndex });
        return 'success';
    } catch (error) {
        display_error_message('Error adding a Master PDF.', error);
        throw error;
    }
}

/**
 * Remove a Master PDF from the masterpdf collection database.
 * @param {string} nom - The name of the Master PDF.
 */
async function removeMasterPDF(nom) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(master_collection_name);
        await collection.deleteOne({ nom: nom });

        const masterPDFs = await collection.find().sort({ index: 1 }).toArray();
        for (let i = 0; i < masterPDFs.length; i++) {
            await collection.updateOne(
                { nom: masterPDFs[i].nom },
                { $set: { index: i } }
            );
        }
        return 'success';
    } catch (error) {
        display_error_message('Error removing a Master PDF.', error);
        throw error;
    }
}

/* ====================PDF RELATED FUNCTIONS==================== */

/**
 * Fetches all PDFs of a given pdfmaster from the pdf collection database.
 * @param {string} master - The name of the Master PDF.
 * @returns {Array} - An array of all the PDFs of the given Master PDF.
 */
async function fetchPDFsByMaster(master) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(pdf_collection_name);
        const PDFs = await collection.find({ master: master }).toArray();
        return PDFs;
    } catch (error) {
        display_error_message('Error fetching all PDFs.', error);
        throw error;
    }
}

/**
 * Add a PDF to the pdf collection database.
 * @param {string} nom - The name of the PDF.
 * @param {string} link - The link to the PDF.
 * @param {string} master - The name of the Master PDF.
 */
async function addPDF(master, nom, link) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(pdf_collection_name);

        // If the PDF already exists, return null
        const existingPDF = await collection.findOne({ nom: nom, master: master });
        if (existingPDF) {
            return null;
        }
        const last_index = await collection.find({master: master}).sort({ index: -1 }).limit(1).toArray();
        const newIndex = (last_index.length > 0) ? last_index[0].index + 1 : 0;
        await collection.insertOne({ nom: nom, index: newIndex, link: link, master: master });
    } catch (error) {
        display_error_message('Error adding a PDF.', error);
        throw error;
    }
}

/**
 * Remove a PDF from the pdf collection in the database and update indices.
 * @param {string} nom - The name of the PDF.
 * @param {string} master - The name of the Master PDF.
 */
async function removePDF(master, nom) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(pdf_collection_name);
        
        await collection.deleteOne({ nom: nom, master: master });

        const PDFs = await collection.find({ master: master }).sort({ index: 1 }).toArray();
        for (let i = 0; i < PDFs.length; i++) {
            await collection.updateOne(
                { nom: PDFs[i].nom, master: master },
                { $set: { index: i } }
            );
        }
    } catch (error) {
        display_error_message('Error removing a PDF.', error);
        throw error;
    }
}

/* ====================================================== INDEXES FUNCTIONS ========================================================== */

/**
 * Function to fetch all the indexes from the MongoDB database.
 * @returns {Array} - An array of indexes : [{MasterPDFIndex: 0, PDFIndex: 0}]
 */
async function fetchIndexes() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(index_collection_name);

        const results = await collection.find().toArray();

        if (results.length === 0) {
            await collection.insertOne({ MasterPDFIndex: 0, PDFIndex: 0});
            return [{ MasterPDFIndex: 0, PDFIndex: 0 }];
        }
        await collection.updateOne({}, { $inc: { PDFIndex: 1 } });

        return results;
    } catch (error) {
        display_error_message('Error fetching indexes from the database:', error);
        throw error;
    }
}

/**
 * Function to update the MasterPDFIndex in the MongoDB database.
 */

async function updateMasterPDFIndex() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(index_collection_name);

        await collection.updateOne({}, { $inc: { MasterPDFIndex: 1 }, $set: { PDFIndex: 1 } });
    } catch (error) {
        display_error_message('Error updating MasterPDFIndex in the database.', error);
        throw error;
    }
}

/* ====================================================== DAILY LEETCODE FUNCTIONS ========================================================== */

/*
* The "leetcode" collection posses items in this form:
    {
        Leetcode_account: LeetcodeAccountExample,
        Discord_user: DiscordIDUserExample,
    }
*/

/**
 * Function to add a Leetcode account to the MongoDB database
 * @param {string} Leetcode_account - The Leetcode account
 * @param {string} Discord_user - The Discord user
 * @param {function} callback - The callback function
 */

async function add_leetcode_account(Leetcode_account, Discord_user, callback) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(leetcode_collection_name);
    
        const result = await collection.insertOne({ Leetcode_account, Discord_user });
        callback(null, result);
    } catch (error) {
        display_error_message('Error adding Leetcode account to the database:', error);
        throw error;
    }
  }
  
  /**
  * Function to fetch Leetcode accounts from the MongoDB database
  * @returns {Array} - An array of Leetcode accounts
  */
  
  async function fetch_leetcode_accounts() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(leetcode_collection_name);
    
        const results = await collection.find().toArray();
        return results;
    } catch (error) {
        display_error_message('Error fetching Leetcode accounts from the database:', error);
        throw error;
    }
  }
  
  /**
  * Function to delete a Leetcode account from the MongoDB database
  * @param {string} Leetcode_account - The Leetcode account
  * @param {function} callback - The callback function
  */
  
  async function delete_leetcode_account(Leetcode_account, callback) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(leetcode_collection_name);
    
        const result = await collection.deleteOne({ Leetcode_account });
        callback(null, result);
    } catch (error) {
        display_error_message('Error deleting Leetcode account from the database:', error);
        throw error;
    }
  }

/* ====================================================== DAILY MICROLEARNING FUNCTIONS ========================================================== */

/*
 * The "microlearning" collection contains items in the following form:
 * {
 *   "title": "TitleExample",
 *   "description": "DescriptionExample",
 *   "article": "ArticleExample",
 *   "index": 0
 * }
 */

/**
 * Fetches all Microlearning data from the MongoDB database.
 * @returns {Promise<Array>} - A promise that resolves to an array of Microlearning data
 */
async function fetchMicrolearningData() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(microlearning_collection_name);
    
        // Fetch all documents sorted by index
        const results = await collection.find().sort({ index: 1 }).toArray();
        return results;
    } catch (error) {
        display_error_message('Error fetching Microlearning data from the database:', error);
        throw error;
    }
}

/**
 * Adds a new Microlearning data entry to the MongoDB database.
 * @param {string} title - The title of the Microlearning data
 * @param {string} description - The description of the Microlearning data
 * @param {string} article - The article content of the Microlearning data
 * @returns {Promise<InsertOneResult>} - A promise that resolves to the result of the insertion
 */
async function addMicrolearningData(title, description, article) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(microlearning_collection_name);
    
        // Determine the next index value
        const lastIndex = await collection.find().sort({ index: -1 }).limit(1).toArray();
        const index = (lastIndex.length > 0) ? lastIndex[0].index + 1 : 0;
        
        // Check if the title already exists
        const existingMicrolearning = await collection.findOne({ title });
        if (existingMicrolearning) {
            return null;
        }
        // Insert the new document
        const result = await collection.insertOne({ title, description, article, index });
        return result;
    } catch (error) {
        display_error_message('Error adding Microlearning data to the database:', error);
        throw error;
    }
}

/**
 * Removes a Microlearning data entry from the MongoDB database by title.
 * Updates the indices of remaining documents after removal.
 * @param {string} title - The title of the Microlearning data to be removed
 * @returns {Promise<DeleteResult>} - A promise that resolves to the result of the deletion
 */
async function removeMicrolearningData(title) {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(microlearning_collection_name);
        
        // Update indices for remaining documents
        const microlearningData = await collection.find().sort({ index: 1 }).toArray();
        for (let i = 0; i < microlearningData.length; i++) {
            await collection.updateOne(
                { title: microlearningData[i].title },
                { $set: { index: i } }
            );
        }
        
        // Remove the specified document
        const result = await collection.deleteOne({ title });
        return result;
    } catch (error) {
        display_error_message('Error removing Microlearning data from the database:', error);
        throw error;
    }
}

/**
 * Gets and increments the index of Microlearning data.
 * If no index exists, initializes it.
 * @returns {Promise<number>} - A promise that resolves to the current index value
 */
async function getMicrolearningIndex() {
    try {
        const client = await getMongoClient(); // Reuse the same client
        const database = client.db(database_name);
        const collection = database.collection(microlearning_collection_name);

        // Fetch the current index
        const indexData = await collection.find().sort({ MasterIndex: -1 }).limit(1).toArray();
        
        // Initialize MasterIndex if it does not exist
        if (indexData.length === 0) {
            await collection.insertOne({ MasterIndex: 1 });
            return 0;
        }
        
        // Increment MasterIndex and return the previous value
        const currentIndex = indexData[0].MasterIndex;
        await collection.updateOne({}, { $inc: { MasterIndex: 1 } });
        return currentIndex;
    } catch (error) {
        display_error_message('Error fetching Microlearning index from the database:', error);
        throw error;
    }
}


/* ====================================================== EXPORT FUNCTIONS ========================================================== */

module.exports = {
    fetchAllMasterPDFs,
    addMasterPDF,
    removeMasterPDF,
    fetchPDFsByMaster,
    addPDF,
    removePDF,
    fetchIndexes,
    disconnectFromMongoDB,
    add_leetcode_account,
    fetch_leetcode_accounts,
    delete_leetcode_account,
    updateMasterPDFIndex,
    fetchMicrolearningData,
    addMicrolearningData,
    removeMicrolearningData,
    getMicrolearningIndex
};
