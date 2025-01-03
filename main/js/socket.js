// Check if the socket connection already exists
let socket;
if (!window.socket) {
    socket = io();  // Only initialize if socket is not already initialized
    window.socket = socket;
} else {
    socket = window.socket;
}

// Update connection status
const statusElement = document.getElementById("status");

socket.on("connect", () => {
    statusElement.textContent = "Status: Connected";
    statusElement.className = "connected";
});

socket.on("disconnect", () => {
    statusElement.textContent = "Status: Disconnected";
    statusElement.className = "disconnected";
});

socket.on('mqttMessage', (data) => {
    messages.push(data);

    const listItem = document.createElement('li');
    listItem.className = 'message-item';
    listItem.innerHTML =  `  
        <div>
            <div class="message-topic">Topic: ${data.topic}</div>
            <div class="message-content">Message: ${data.message}</div>
        </div>
        <div class="message-time">${data.time}</div>`;

    latestMessages.insertBefore(listItem, latestMessages.firstChild);

    // Remove older messages once max limit is reached
    while (latestMessages.childElementCount > 5) {
        const oldItem = latestMessages.lastChild;
        latestMessages.removeChild(oldItem);
        olderMessages.insertBefore(oldItem, olderMessages.firstChild);
    }

    filterMessages(topicFilterSelect.value);
});
