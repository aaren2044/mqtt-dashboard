document.addEventListener('DOMContentLoaded', function () {
    const statusTableBody = document.querySelector('#statusTable tbody');
    const ai1Data = [];
    const ai2Data = [];
    const timeLabels = [];

    // Initialize the chart
    const ctx = document.getElementById('aiChart').getContext('2d');
    const aiChart = new Chart(ctx, {
        type: 'line',  // Line chart
        data: {
            labels: timeLabels,  // X-axis labels (time or index)
            datasets: [
                {
                    label: 'AI1',
                    data: ai1Data,  // AI1 data
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false
                },
                {
                    label: 'AI2',
                    data: ai2Data,  // AI2 data
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Function to update the status table with fetched data
    function updateStatusTable(data) {
        // Clear the table first (so only the latest 10 records are shown)
        statusTableBody.innerHTML = '';

        // Clear previous chart data
        ai1Data.length = 0;
        ai2Data.length = 0;
        timeLabels.length = 0;

        // Only take the latest 10 records (you can modify the slicing logic if you want more/less data)
        const latestData = data.slice(0, 10);

        latestData.forEach((row) => {
            // Skip entries where type is not 'IO'
            if (row.type !== 'IO') return;

            // Update the status indicators based on DI1, DI2, DO1
            updateStatusIndicators(row);

            // Create a new row for the table
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${row.UID || 'N/A'}</td>
                <td>${row.AI1 !== undefined && row.AI1 !== null ? row.AI1 : 'N/A'}</td>
                <td>${row.AI2 !== undefined && row.AI2 !== null ? row.AI2 : 'N/A'}</td>
                <td>${row.DI1 !== undefined && row.DI1 !== null ? row.DI1 : 'N/A'}</td>
                <td>${row.DI2 !== undefined && row.DI2 !== null ? row.DI2 : 'N/A'}</td>
                <td>${row.DO1 !== undefined && row.DO1 !== null ? row.DO1 : 'N/A'}</td>
                <td>${row.Coordinates || 'N/A'}</td>
            `;
            statusTableBody.appendChild(tableRow);

            // Capture AI1 and AI2 values and update the graph
            if (row.AI1 !== undefined && row.AI2 !== undefined) {
                ai1Data.push(row.AI1);
                ai2Data.push(row.AI2);
                timeLabels.push(new Date().toLocaleTimeString());
            }
        });

        // After new data is added, update the chart
        aiChart.update();
    }

    // Function to update the status indicators based on DI1, DI2, DO1
    function updateStatusIndicators(row) {
        // Check if DI1, DI2, and DO1 exist in the row object before updating
        if (row.DI1 !== undefined && row.DI1 !== null) {
            const di1Status = document.getElementById('DI1-status');
            updateIndicatorColor(di1Status, row.DI1 === 0, row.DI1 === 1);
        }

        if (row.DI2 !== undefined && row.DI2 !== null) {
            const di2Status = document.getElementById('DI2-status');
            updateIndicatorColor(di2Status, row.DI2 === 0, row.DI2 === 1);
        }

        if (row.DO1 !== undefined && row.DO1 !== null) {
            const do1Status = document.getElementById('DO1-status');
            updateIndicatorColor(do1Status, row.DO1 === 0, row.DO1 === 1);
        }
    }

    // Helper function to update the color of indicator squares
    function updateIndicatorColor(element, isGreen, isRed) {
        if (!element) return;  // Prevent errors if element is not found
        element.classList.remove('green', 'red', 'grey');
        if (isGreen) {
            element.classList.add('green');
        } else if (isRed) {
            element.classList.add('red');
        } else {
            element.classList.add('grey');
        }
    }

    // Function to fetch data from MySQL
    async function fetchDatabaseData() {
        const url = '/api/messages/mysql'; // MySQL endpoint

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Filter data to only include 'IO' type and then update the table
            const filteredData = data.filter(row => row.type === 'IO');
            updateStatusTable(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Fetch data on page load
    fetchDatabaseData();

    // Auto-refresh the data every 5 seconds (5000 milliseconds)
    setInterval(fetchDatabaseData, 5000);
    setInterval(updateIndicatorColor, 5000);
    setInterval(updateStatusIndicators, 5000);

});



function viewDatabaseData() {
    const selectedValue = document.getElementById('viewDataSelect').value;
    if (selectedValue === 'mysql') {
        window.location.href = '/views/mysql-data.html';
    } else if (selectedValue === 'mongo') {
        window.location.href = '/views/mongo-data.html';
    }
    else if (selectedValue === 'arduino') {
        window.location.href = '/views/arduino.html';
    }
}
