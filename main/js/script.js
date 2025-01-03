const latestMessages = document.getElementById('latestMessages');
const olderMessages = document.getElementById('olderMessages');
const topicSelect = document.getElementById('topicSelect');
const subscribeButton = document.getElementById('subscribeButton');
const createTopic = document.getElementById('createTopic');
const createTopicButton = document.getElementById('createTopicButton');
const publishTopicSelect = document.getElementById('publishTopicSelect');
const publishMessage = document.getElementById('publishMessage');
const publishButton = document.getElementById('publishButton');
const topicFilterSelect = document.getElementById('topicFilterSelect');
const downloadTopicSelect = document.getElementById('downloadTopicSelect');
const downloadJSONButton = document.getElementById('downloadJSONButton');
const downloadCSVButton = document.getElementById('downloadCSVButton');
const downloadTXTButton = document.getElementById('downloadTXTButton');
const viewMySQLMessagesButton = document.getElementById('viewMySQLMessagesButton');
const viewMongoMessagesButton = document.getElementById('viewMongoMessagesButton');

let messages = [];  // Array to hold all received messages
let topics = [];    // Array to hold topics for filtering

function addTopicToDropdown(topic) {
    const existingOptions = Array.from(topicSelect.options).map(option => option.value);
    if (!existingOptions.includes(topic)) {
        const newOption = document.createElement('option');
        newOption.value = topic;
        newOption.textContent = topic;
        topicSelect.appendChild(newOption);
    }

    if (!topics.includes(topic)) {
        topics.push(topic);

        const filterOption = document.createElement('option');
        filterOption.value = topic;
        filterOption.textContent = topic;
        topicFilterSelect.appendChild(filterOption);

        const downloadOption = document.createElement('option');
        downloadOption.value = topic;
        downloadOption.textContent = topic;
        downloadTopicSelect.appendChild(downloadOption);

        const publishOption = document.createElement('option');
        publishOption.value = topic;
        publishOption.textContent = topic;
        publishTopicSelect.appendChild(publishOption);
    }
}

createTopicButton.addEventListener('click', () => {
    const topic = createTopic.value.trim();
    if (topic) {
        addTopicToDropdown(topic);
        alert(`Created topic: ${topic}`);
        createTopic.value = '';
    } else {
        alert('Please enter a topic name!');
    }
});

subscribeButton.addEventListener('click', () => {
    const topic = topicSelect.value;
    if (topic) {
        socket.emit('subscribeToTopic', { topic });
        addTopicToDropdown(topic);
        alert(`Subscribed to ${topic}`);
    } else {
        alert('Please select a topic!');
    }
});

publishButton.addEventListener('click', () => {
    const topic = publishTopicSelect.value; // Selected topic
    const message = publishMessage.value.trim(); // Message to be sent
    const storeMessage = document.getElementById('storeMessageCheckbox').checked; // Check the tickbox status

    if (topic && message) {
        // Emit the publish event with the storeMessage flag
        socket.emit('publishMessage', { topic, message, storeMessage });

        alert(`Published: ${message} to ${topic}`);
        publishMessage.value = '';
    } else {
        alert('Select a topic and enter a message!');
    }
});

topicFilterSelect.addEventListener('change', () => {
    const selectedTopic = topicFilterSelect.value;
    filterMessages(selectedTopic);
});

function filterMessages(topic) {
    const allLatestMessages = Array.from(latestMessages.children);
    allLatestMessages.forEach((message) => {
        if (topic === "" || message.querySelector('.message-topic').textContent.includes(topic)) {
            message.style.display = 'block';
        } else {
            message.style.display = 'none';
        }
    });

    const allOlderMessages = Array.from(olderMessages.children);
    allOlderMessages.forEach((message) => {
        if (topic === "" || message.querySelector('.message-topic').textContent.includes(topic)) {
            message.style.display = 'block';
        } else {
            message.style.display = 'none';
        }
    });
}

function viewDatabaseData() {
    const selectedValue = document.getElementById('viewDataSelect').value;
    if (selectedValue === 'mysql') {
        window.location.href = '/views/mysql-data.html';
    } else if (selectedValue === 'mongo') {
        window.location.href = '/views/mongo-data.html';
    }
}
