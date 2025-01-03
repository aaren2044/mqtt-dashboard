document.addEventListener('DOMContentLoaded', () => {
    // MongoDB-specific elements
    const tableSizeSelect = document.getElementById('mongoTableSizeSelect');
    const mongoMessagesTable = document.getElementById('mongoMessagesTable').getElementsByTagName('tbody')[0];
    const messageModal = document.getElementById('messageModal');
    const closeModal = document.getElementById('closeModal');
    const messageText = document.getElementById('messageText');
    const downloadMessageButton = document.getElementById('downloadMessageButton');
    const downloadFormatSelect = document.getElementById('downloadFormatSelect');
    const mongoTopicFilterSelect = document.getElementById('mongoTopicFilterSelect');
    const mongoDownloadButton = document.getElementById('mongoDownloadButton');
    let selectedMessage = null;

    let currentTableSize = 10; // Default to 10 messages per page
    let allMessages = []; // Store the entire dataset

    // Get date and time filter elements
    const startDateFilter = document.getElementById('startDateFilter');
    const startTimeFilter = document.getElementById('startTimeFilter');
    const endDateFilter = document.getElementById('endDateFilter');
    const endTimeFilter = document.getElementById('endTimeFilter');
    const applyDateTimeFilterButton = document.getElementById('applyDateTimeFilter');

    // Table size selection for MongoDB
    tableSizeSelect.addEventListener('change', (event) => {
        currentTableSize = event.target.value === "All" ? Infinity : parseInt(event.target.value, 10);
        renderFilteredMessages(); // Re-render messages based on new table size and selected filter
    });

    // Function to fetch and render MongoDB messages
    async function fetchMessages(apiUrl) {
        try {
            console.log('Fetching messages from:', apiUrl);
            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log('Received data:', data);

            allMessages = data; // Store fetched messages
            allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort messages by timestamp in descending order
            populateTopicFilterSelect(data); // Populate the topic filter dropdown
            renderFilteredMessages(); // Render messages based on current filter
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    // Function to render filtered messages
    function renderFilteredMessages() {
        const selectedTopic = mongoTopicFilterSelect.value;
        console.log('Selected Topic:', selectedTopic);

        // Get the selected date and time range
        const startDateTime = combineDateTime(startDateFilter.value, startTimeFilter.value);
        const endDateTime = combineDateTime(endDateFilter.value, endTimeFilter.value);

        // Filter messages based on selected topic and date-time range
        const filteredMessages = allMessages.filter((msg) => {
            // Topic filter
            const topicMatch = selectedTopic ? msg.topic === selectedTopic : true;

            // Date and time filter
            const messageDate = new Date(msg.timestamp); // Assuming timestamp is in a standard format
            const dateMatch = (!startDateTime || messageDate >= startDateTime) &&
                              (!endDateTime || messageDate <= endDateTime);

            return topicMatch && dateMatch;
        });

        console.log('Filtered Messages:', filteredMessages);

        // Limit the number of messages displayed based on the table size
        const messagesToRender = filteredMessages.slice(0, currentTableSize);

        // Clear existing rows
        mongoMessagesTable.innerHTML = '';

        // Render filtered messages in the table
        messagesToRender.forEach((item) => {
            const row = mongoMessagesTable.insertRow();
            const idCell = row.insertCell(0);
            const topicCell = row.insertCell(1);
            const timeCell = row.insertCell(2);

            idCell.textContent = item._id || item.id;  // Mongo uses _id by default
            topicCell.textContent = item.topic;
            timeCell.textContent = new Date(item.timestamp).toLocaleString();

            // Make Topic clickable
            topicCell.style.cursor = 'pointer';
            topicCell.addEventListener('click', () => openMessageModal(item));
        });
    }

    // Function to combine date and time into a single Date object
    function combineDateTime(dateInput, timeInput) {
        const date = dateInput ? new Date(dateInput) : null;
        if (date && timeInput) {
            const [hours, minutes] = timeInput.split(':');
            date.setHours(hours);
            date.setMinutes(minutes);
            date.setSeconds(0);  // Optional: you can also set seconds if needed
        }
        return date;
    }

    // Function to populate the topic filter dropdown with unique topics
    function populateTopicFilterSelect(data) {
        const topics = [...new Set(data.map(item => item.topic))];
        
        // Clear existing options
        mongoTopicFilterSelect.innerHTML = '<option value="">Select Topic (MongoDB)</option>';
        
        // Add options for each topic
        topics.forEach((topic) => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            mongoTopicFilterSelect.appendChild(option);
        });
    }

    // Function to open the modal and show the message
    function openMessageModal(item) {
        selectedMessage = item;
        messageText.value = item.message; // Display message in the modal
        messageModal.style.display = 'block'; // Show the modal
    }

    // Event listener for closing the modal
    closeModal.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    // Event listener for "Download Message" button
    downloadMessageButton.addEventListener('click', () => {
        if (selectedMessage) {
            const format = downloadFormatSelect.value;
            exportMessageData(format, selectedMessage);
        }
    });

    // Function to export the selected message in the selected format
    function exportMessageData(format, message) {
        let data;
        
        if (format === 'json') {
            data = JSON.stringify(message);
        } else if (format === 'csv') {
            data = `"ID","Topic","Time","Message"\n"${message._id || message.id}","${message.topic}","${new Date(message.timestamp).toLocaleString()}","${message.message}"`;
        } else if (format === 'txt') {
            data = `ID: ${message._id || message.id}\nTopic: ${message.topic}\nMessage: ${message.message}\nTimestamp: ${new Date(message.timestamp).toLocaleString()}\n\n`;
        }

        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `message_${message._id || message.id}.${format}`;
        link.click();
    }

    // Event listener for "Download All Data" button
    mongoDownloadButton.addEventListener('click', async () => {
        try {
            const format = document.getElementById('mongoDownloadFormatSelect').value;
            const selectedTopic = mongoTopicFilterSelect.value;

            // Filter the messages based on the topic selection
            const filteredMessages = selectedTopic
                ? allMessages.filter((msg) => msg.topic === selectedTopic)
                : allMessages;

            exportAllMessagesData(format, filteredMessages);
        } catch (error) {
            console.error('Error downloading all messages:', error);
        }
    });

    // Function to export all messages in the selected format
    function exportAllMessagesData(format, data) {
        let exportData;

        if (format === 'json') {
            exportData = data.map(item => JSON.stringify(item)).join('\n');
        } else if (format === 'csv') {
            exportData = `"ID","Topic","Time","Message"\n`;
            data.forEach((item) => {
                exportData += `"${item._id || item.id}","${item.topic}","${new Date(item.timestamp).toLocaleString()}","${item.message}"\n`;
            });
        } else if (format === 'txt') {
            exportData = data.map(item => {
                return `ID: ${item._id || item.id}\nTopic: ${item.topic}\nMessage: ${item.message}\nTimestamp: ${new Date(item.timestamp).toLocaleString()}\n\n`;
            }).join('');
        }

        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mongo_data.${format}`;
        link.click();
    }

    // Event listener for topic filter change
    mongoTopicFilterSelect.addEventListener('change', renderFilteredMessages);

    // Event listener for date/time filter button click
    applyDateTimeFilterButton.addEventListener('click', renderFilteredMessages);

    // Fetch messages every 5 seconds
    const fetchInterval = 5000; // 5 seconds

    // Initial fetch and render messages
    fetchMessages('/api/messages/mongo');

    // Set up the interval to fetch and refresh the messages periodically
    setInterval(() => {
        fetchMessages('/api/messages/mongo');
    }, fetchInterval);
});
