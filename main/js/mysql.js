document.addEventListener('DOMContentLoaded', function() {
    // MySQL-specific elements
    const tableSizeSelect = document.getElementById('tableSizeSelect');
    const mysqlMessagesTable = document.getElementById('mysqlMessagesTable').getElementsByTagName('tbody')[0];
    const messageModal = document.getElementById('messageModal');
    const closeModal = document.getElementById('closeModal');
    const messageText = document.getElementById('messageText');
    const downloadMessageButton = document.getElementById('downloadMessageButton');
    const downloadFormatSelect = document.getElementById('downloadFormatSelect');
    const mysqlDownloadButton = document.getElementById('mysqlDownloadButton');
    let selectedMessage = null;

    let currentTableSize = 10; // Default to 10 messages per page
    let allMessages = []; // To store all the fetched messages

    // New Date and Time Filter elements
    const startDateFilter = document.getElementById('startDateFilter');
    const startTimeFilter = document.getElementById('startTimeFilter');
    const endDateFilter = document.getElementById('endDateFilter');
    const endTimeFilter = document.getElementById('endTimeFilter');
    const applyDateTimeFilterButton = document.getElementById('applyDateTimeFilter');

    // New ID and Type Filter elements
    const mysqlIdFilter = document.getElementById('mysqlIdFilter');
    const mysqlTypeFilter = document.getElementById('mysqlTypeFilter');

    // Function to refresh the messages (re-fetch data and re-render the table)
document.getElementById('refreshButton').addEventListener('click', async function() {
    console.log('Refreshing MySQL messages...');
    await fetchMessages();  // Calls the existing fetchMessages function to re-fetch and re-render
});

// Fetch messages function (already defined)
async function fetchMessages() {
    try {
        const response = await fetch('/api/messages/mysql');
        allMessages = await response.json();
        console.log('Fetched messages:', allMessages);

        // Populate the filters dynamically
        populateFilters(allMessages);

        // Render messages based on current filter settings
        renderMessages(currentTableSize);
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

    // Fetch messages from the backend
    async function fetchMessages() {
        try {
            const response = await fetch('/api/messages/mysql');
            allMessages = await response.json();
            console.log('Fetched messages:', allMessages);

            // Populate the filters dynamically
            populateFilters(allMessages);

            // Render messages based on current filter settings
            renderMessages(currentTableSize);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    // Function to populate the ID and Type filter dropdowns dynamically
    function populateFilters(data) {
        const ids = [...new Set(data.map(item => item.id))]; // Get unique IDs
        const types = [...new Set(data.map(item => item.type))]; // Get unique Types

        // Populate the ID filter dropdown
        mysqlIdFilter.innerHTML = '<option value="">Select ID</option>';
        ids.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            mysqlIdFilter.appendChild(option);
        });

        // Populate the Type filter dropdown
        mysqlTypeFilter.innerHTML = '<option value="">Select Type</option>';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            mysqlTypeFilter.appendChild(option);
        });
    }

    // Function to render messages based on the selected filters
    function renderMessages(tableSize) {
        // Clear existing rows
        mysqlMessagesTable.innerHTML = '';
    
        const selectedId = mysqlIdFilter.value.trim(); // ID filter input
        const selectedType = mysqlTypeFilter.value; // Type filter dropdown
    
        // Get the selected date and time range
        const startDateTime = combineDateTime(startDateFilter.value, startTimeFilter.value);
        const endDateTime = combineDateTime(endDateFilter.value, endTimeFilter.value);
    
        // Filter messages based on ID, Type, and date-time range
        const filteredMessages = allMessages.filter((msg) => {
            const idMatch = selectedId ? msg.id.toString().includes(selectedId) : true;
            const typeMatch = selectedType ? msg.type === selectedType : true;
            const messageDate = msg.timestamp ? new Date(msg.timestamp * 1000) : null; // Convert Unix timestamp to JS Date
            const dateMatch = (!startDateTime || (messageDate && messageDate >= startDateTime)) &&
                              (!endDateTime || (messageDate && messageDate <= endDateTime));
            return idMatch && typeMatch && dateMatch;
        });
    
        // If tableSize is 'All', display all messages, otherwise slice it by the selected table size
        const messagesToRender = (tableSize === 'All') ? filteredMessages : filteredMessages.slice(0, tableSize);
    
        // Render the filtered messages in the table
        messagesToRender.forEach((msg) => {
            const row = mysqlMessagesTable.insertRow();
    
            // Insert the fields into the row
            row.insertCell(0).textContent = msg.UID || 'N/A';
            row.insertCell(1).textContent = msg.type;
            row.insertCell(2).textContent = msg.id;
            row.insertCell(3).textContent = msg.DT || 'N/A';
            row.insertCell(4).textContent = msg.AI1 || 'N/A';
            row.insertCell(5).textContent = msg.AI2 || 'N/A';
            row.insertCell(6).textContent = msg.DI1 !== undefined && msg.DI1 !== null ? msg.DI1 : 'N/A';
            row.insertCell(7).textContent = msg.DI2 !== undefined && msg.DI2 !== null ? msg.DI2 : 'N/A';
            row.insertCell(8).textContent = msg.DO1 !== undefined && msg.DO1 !== null ? msg.DO1 : 'N/A';
            row.insertCell(9).textContent = msg.sdtotal || 'N/A';
            row.insertCell(10).textContent = msg.sdavail || 'N/A';
            row.insertCell(11).textContent = msg.ifb || 'N/A';
            row.insertCell(12).textContent = msg.gsm || 'N/A';
            row.insertCell(13).textContent = msg.wifi || 'N/A';
            row.insertCell(14).textContent = msg.coordinate || 'N/A';
            row.insertCell(15).textContent = msg.qno || 'N/A';
            row.insertCell(16).textContent = msg.timestamp || 'N/A';
    
            row.addEventListener('click', () => openMessageModal(msg));
        });
    }    

    // Function to combine date and time into a Date object
    function combineDateTime(dateInput, timeInput) {
        const date = dateInput ? new Date(dateInput) : null;
        if (date && timeInput) {
            const [hours, minutes] = timeInput.split(':');
            date.setHours(hours);
            date.setMinutes(minutes);
            date.setSeconds(0); // Optional: you can also set seconds if needed
        }
        return date;
    }

    // Function to open the modal and show the message details
function openMessageModal(item) {
    selectedMessage = item;
    messageText.value = `ID: ${item.id}\nType: ${item.type}\nTimestamp: ${item.timestamp}\n` +
        `DT: ${item.DT || 'N/A'}\nAI1: ${item.AI1 || 'N/A'}\nAI2: ${item.AI2 || 'N/A'}\n` +
        `DI1: ${item.DI1 !== undefined && item.DI1 !== null ? item.DI1 : 'N/A'}\n` +
        `DI2: ${item.DI2 !== undefined && item.DI2 !== null ? item.DI2 : 'N/A'}\n` +
        `DO1: ${item.DO1 !== undefined && item.DO1 !== null ? item.DO1 : 'N/A'}\n` +
        `SD Total: ${item.sdtotal || 'N/A'}\nSD Avail: ${item.sdavail || 'N/A'}\n` +
        `IFB: ${item.ifb || 'N/A'}\nGSM: ${item.gsm || 'N/A'}\nWIFI: ${item.wifi || 'N/A'}\n` +
        `Coordinate: ${item.coordinate || 'N/A'}\nQNO: ${item.qno || 'N/A'}`;

    messageModal.style.display = 'block';
}


    // Close the modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            messageModal.style.display = 'none';
        });
    }

    // Download button for selected message
    if (downloadMessageButton) {
        downloadMessageButton.addEventListener('click', () => {
            if (selectedMessage) {
                const format = downloadFormatSelect.value;
                exportMessageData(format, selectedMessage);
            }
        });
    }

    // Function to export message data in selected format
    function exportMessageData(format, message) {
        let data;
        let fileExtension;

        // Check the selected format and prepare data accordingly
        if (format === 'json') {
            data = JSON.stringify(message, null, 2); // JSON format
            fileExtension = 'json';  // Set the file extension to .json
        } else if (format === 'csv') {
            data = `"UID","Type","ID","DT","AI1","AI2","DI1","DI2","DO1","SD Total","SD Avail","ifb","gsm","wifi","coordinate","qno","timestamp"\n"${message.UID}","${message.type}","${message.id}","${message.DT}","${message.AI1}","${message.AI2}","${message.DI1}","${message.DI2}","${message.DO1}","${message.sdtotal}","${message.sdavail}","${message.ifb}","${message.gsm}","${message.wifi}","${message.coordinate}","${message.qno}","${message.timestamp}"`; // CSV format
            fileExtension = 'csv';  // Set the file extension to .csv
        } else if (format === 'txt') {
            data = `UID: ${message.UID}\nType: ${message.type}\nID: ${message.id}\nDT: ${message.DT}\nAI1: ${message.AI1}\nAI2: ${message.AI2}\nDI1: ${message.DI1}\nDI2: ${message.DI2}\nDO1: ${message.DO1}\nSD Total: ${message.sdtotal}\nSD Avail: ${message.sdavail}\nifb: ${message.ifb}\ngsm: ${message.gsm}\nwifi: ${message.wifi}\ncoordinate: ${message.coordinate}\nqno: ${message.qno}\ntimestamp: ${message.timestamp}`; // Text format
            fileExtension = 'txt';  // Set the file extension to .txt
        }

        // Trigger download
        const blob = new Blob([data], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `message_${message.id}.${fileExtension}`;  // Ensure the correct file extension is used
        link.click();
    }

    // Event listener for changing the table size (pagination effect)
    tableSizeSelect.addEventListener('change', (event) => {
        const selectedSize = event.target.value;
        // If "All" is selected, pass 'All' as the size
        currentTableSize = (selectedSize === 'All') ? 'All' : parseInt(selectedSize, 10);
        renderMessages(currentTableSize);
    });    

    // Apply Date/Time filter
    applyDateTimeFilterButton.addEventListener('click', () => renderMessages(currentTableSize));

    // Fetch the messages on page load
    fetchMessages();

    // Download all data button
    if (mysqlDownloadButton) {
        mysqlDownloadButton.addEventListener('click', () => {
            const format = mysqlDownloadFormatSelect.value;
            exportAllMessagesData(format);
        });
    }

    // Function to export all messages data in selected format
    function exportAllMessagesData(format) {
        let data;
        let fileExtension;

        if (format === 'json') {
            data = JSON.stringify(allMessages, null, 2);
            fileExtension = 'json';
        } else if (format === 'csv') {
            const header = `"UID","Type","ID","DT","AI1","AI2","DI1","DI2","DO1","SD Total","SD Avail","ifb","gsm","wifi","coordinate","qno","timestamp"`;
            const rows = allMessages.map(msg => `"${msg.UID}","${msg.type}","${msg.id}","${msg.DT}","${msg.AI1}","${msg.AI2}","${msg.DI1}","${msg.DI2}","${msg.DO1}","${msg.sdtotal}","${msg.sdavail}","${msg.ifb}","${msg.gsm}","${msg.wifi}","${msg.coordinate}","${msg.qno}","${msg.timestamp}"`);
            data = `${header}\n${rows.join('\n')}`;
            fileExtension = 'csv';
        } else if (format === 'txt') {
            data = allMessages.map(msg => `UID: ${msg.UID}\nType: ${msg.type}\nID: ${msg.id}\nDT: ${msg.DT}\nAI1: ${msg.AI1}\nAI2: ${msg.AI2}\nDI1: ${msg.DI1}\nDI2: ${msg.DI2}\nDO1: ${msg.DO1}\nSD Total: ${msg.sdtotal}\nSD Avail: ${msg.sdavail}\nifb: ${msg.ifb}\ngsm: ${msg.gsm}\nwifi: ${msg.wifi}\ncoordinate: ${msg.coordinate}\nqno: ${msg.qno}\ntimestamp: ${msg.timestamp}`).join('\n\n');
            fileExtension = 'txt';
        }

        const blob = new Blob([data], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `all_messages.${fileExtension}`;
        link.click();
    }
});

// Reference to the delete button
const deleteAllMessagesButton = document.getElementById('deleteAllMessagesButton');

// Event listener for deleting all messages
if (deleteAllMessagesButton) {
    deleteAllMessagesButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all messages? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/messages/mysql/deleteAll', { method: 'DELETE' });
                if (response.ok) {
                    alert('All messages have been deleted.');
                    // Refresh the table to reflect the deletion
                    await fetchMessages();
                } else {
                    alert('Failed to delete messages. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting messages:', error);
                alert('An error occurred while deleting messages.');
            }
        }
    });
}
