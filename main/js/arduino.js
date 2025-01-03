document.addEventListener('DOMContentLoaded', function() {
    const tableSizeSelect = document.getElementById('tableSizeSelect');
    const mysqlMessagesTable = document.getElementById('mysqlMessagesTable').getElementsByTagName('tbody')[0];
    const refreshButton = document.getElementById('refreshButton');
    const applyDateTimeFilterButton = document.getElementById('applyDateTimeFilter');
    const startDateFilter = document.getElementById('startDateFilter');
    const startTimeFilter = document.getElementById('startTimeFilter');
    const endDateFilter = document.getElementById('endDateFilter');
    const endTimeFilter = document.getElementById('endTimeFilter');

    let currentTableSize = 10; // Default to 10 messages per page
    let allMessages = [];

    // Fetch messages function
    async function fetchMessages() {
        try {
            const response = await fetch('/api/messages/arduino');  // Fetch Arduino data
            const textResponse = await response.text();  // Get the raw response text
            console.log('Raw Response:', textResponse);  // Log the raw response
            
            // Attempt to parse it as JSON
            allMessages = JSON.parse(textResponse);  // Update the global allMessages variable
            renderMessages(currentTableSize);  // Render the data
        } catch (error) {
            console.error('Error fetching Arduino messages:', error);
        }
    }       

    // Render messages based on the selected filters
    function renderMessages(tableSize) {
        mysqlMessagesTable.innerHTML = '';  // Clear the table body before rendering
    
        // Add some logs for debugging
        console.log('Rendering messages with table size:', tableSize);
        console.log('Filtered Messages:', allMessages);
    
        const startDateTime = combineDateTime(startDateFilter.value, startTimeFilter.value);
        const endDateTime = combineDateTime(endDateFilter.value, endTimeFilter.value);
    
        const filteredMessages = allMessages.filter(msg => {
            const messageDate = new Date(msg.timestamp);
            const dateMatch = (!startDateTime || messageDate >= startDateTime) &&
                              (!endDateTime || messageDate <= endDateTime);
            return dateMatch;
        });
    
        console.log('Filtered Messages after date/time check:', filteredMessages); // Debugging line
    
        const messagesToRender = (tableSize === 'All') ? filteredMessages : filteredMessages.slice(0, tableSize);
    
        messagesToRender.forEach(msg => {
            const row = mysqlMessagesTable.insertRow();
            row.insertCell(0).textContent = msg.id;         // Insert ID in the first cell
            row.insertCell(1).textContent = msg.message;    // Insert Message in the second cell
            row.insertCell(2).textContent = msg.timestamp;  // Insert Timestamp in the third cell
    
            row.addEventListener('click', () => openMessageModal(msg));
        });
    
        // Check if no rows were added
        if (messagesToRender.length === 0) {
            const row = mysqlMessagesTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 3; // Ensure the 'No messages to display' spans all 3 columns
            cell.textContent = "No messages to display.";
        }
    }        

    function combineDateTime(dateInput, timeInput) {
        const date = dateInput ? new Date(dateInput) : null;
        if (date && timeInput) {
            const [hours, minutes] = timeInput.split(':');
            date.setHours(hours);
            date.setMinutes(minutes);
            date.setSeconds(0);
        }
        return date;
    }

    function openMessageModal(item) {
        const messageText = document.getElementById('messageText');
        messageText.value = `ID: ${item.id}\nMessage: ${item.message}\nTimestamp: ${item.timestamp}`;
        document.getElementById('messageModal').style.display = 'block';
    }    

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('messageModal').style.display = 'none';
    });

    refreshButton.addEventListener('click', fetchMessages);
    tableSizeSelect.addEventListener('change', function() {
        currentTableSize = this.value;
        renderMessages(currentTableSize);
    });

    applyDateTimeFilterButton.addEventListener('click', function() {
        renderMessages(currentTableSize);
    });

    fetchMessages(); // Initial fetch when page loads
});

// Reference to the delete button
const deleteAllMessagesButton = document.getElementById('deleteAllMessagesButton');

// Event listener for deleting all messages
if (deleteAllMessagesButton) {
    deleteAllMessagesButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all messages? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/messages/arduino/deleteAll', { method: 'DELETE' });
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