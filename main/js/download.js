// Download and export data functions
async function downloadFile(data, extension, mimeType, topic) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `mqtt_messages${topic ? `_${topic}` : ''}_${timestamp}.${extension}`;

    const blob = new Blob([data], { type: mimeType });

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: `${extension.toUpperCase()} File`,
                    accept: { [mimeType]: [`.${extension}`] },
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (error) {
            console.error('File saving error:', error);
        }
    } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

function exportData(format) {
    const selectedTopic = downloadTopicSelect.value;
    const filteredMessages = selectedTopic
        ? messages.filter((msg) => msg.topic === selectedTopic)
        : messages;

    if (filteredMessages.length === 0) {
        alert('No messages available for the selected topic.');
        return;
    }

    let data;
    let mimeType;

    if (format === 'json') {
        data = JSON.stringify(filteredMessages, null, 2);
        mimeType = 'application/json';
    } else if (format === 'csv') {
        const headers = 'Topic,Message,Time\n';
        const rows = filteredMessages
            .map((msg) => `${msg.topic},${msg.message},${msg.time}`)
            .join('\n');
        data = headers + rows;
        mimeType = 'text/csv';
    } else if (format === 'txt') {
        data = filteredMessages
            .map((msg) => `Topic: ${msg.topic}\nMessage: ${msg.message}\nTime: ${msg.time}\n`)
            .join('\n');
        mimeType = 'text/plain';
    }

    downloadFile(data, format, mimeType, selectedTopic || 'all');
}

// Adding event listener for the new dropdown
const downloadFormatSelect = document.getElementById('downloadFormatSelect');

downloadFormatSelect.addEventListener('change', () => {
    const selectedFormat = downloadFormatSelect.value;
    if (selectedFormat) {
        exportData(selectedFormat);
    }
});
