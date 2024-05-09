const { createObjectCsvWriter } = require('csv-writer');

async function writeCsvFile(data, filePath) {
    try {
        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
        });

        await csvWriter.writeRecords(data);
        console.log(` 📚 CSV file has been written successfully --- at ${filePath} 🔖🔖`);
    } catch (error) {
        console.error('Error writing CSV file:', error);
    }
}

// // Example usage:
// const data = [
//     { name: 'John', age: 30, city: 'New York' },
//     { name: 'Alice', age: 25, city: 'Los Angeles' },
//     { name: 'Bob', age: 35, city: 'Chicago' }
// ];

// const filePath = 'csvResults/output.csv';

// writeCsvFile(data, filePath);
// 
module.exports = {writeCsvFile}