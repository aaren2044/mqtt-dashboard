const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const { MongoClient } = require('mongodb');
const path = require('path');

// MQTT Configuration
const brokerUrl = "mqtt://192.168.0.137:1883";
// const brokerUrl = "mqtt://localhost:1883";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('main')); // Serve static files from the "main" directory

// MySQL Database client setup
const dbMySQL = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'aaren',
    database: 'MODEM',
    port: 3306,
});

// Connect to MySQL Database
dbMySQL.connect((err) => {
    if (err) {
        console.error('Error connecting to the MySQL database:', err.stack);
    } else {
        console.log('Connected to MySQL database');
    }
});

// MongoDB Connection Setup
const mongoUrl = "mongodb://localhost:27017";
const dbName = 'Modem';
let dbMongo;

// Connect to MongoDB
MongoClient.connect(mongoUrl)
    .then(client => {
        dbMongo = client.db(dbName);
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

// Endpoint to get all messages from MySQL
app.get('/api/messages/mysql', (req, res) => {
    dbMySQL.query('SELECT * FROM messages ORDER BY timestamp DESC', (err, results) => {
        if (err) {
            console.error('Error fetching messages from MySQL:', err);
            res.status(500).send('Error fetching messages');
        } else {
            res.json(results);
        }
    });
});

// Endpoint to get all messages from MongoDB
app.get('/api/messages/mongo', async (req, res) => {
    try {
        const messages = await dbMongo.collection('messages').find().toArray();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching MongoDB data:', error);
        res.status(500).json({ error: 'Failed to fetch MongoDB messages' });
    }
});

// Endpoint to get all Arduino messages from MySQL
app.get('/api/messages/arduino', (req, res) => {
    dbMySQL.query('SELECT * FROM Arduino ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error('Error fetching Arduino messages from MySQL:', err);
            res.status(500).send('Error fetching Arduino messages');
        } else {
            res.json(results);  // Send the results as JSON
        }
    });
});


// MQTT Client Setup
const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('#', (err) => {
        if (err) {
            console.error('Failed to subscribe to MQTT topics:', err);
        } else {
            console.log('Subscribed to all topics');
        }
    });
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
    const msg = { topic, message: message.toString(), time: new Date().toLocaleTimeString() };
    console.log(`Received message on ${topic}: ${message}`);

    // Automatically store the message in MySQL and MongoDB
    insertMessageToDatabaseMySQL(topic, message.toString());
    insertMessageToDatabaseMongo(topic, message.toString());

    // Emit message to clients via Socket.IO
    io.emit('mqttMessage', msg);
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('subscribeToTopic', ({ topic }) => {
        mqttClient.subscribe(topic, (err) => {
            if (err) console.error(`Subscribe failed for ${topic}:`, err.message);
            else console.log(`Subscribed to topic: ${topic}`);
        });
    });

    socket.on('publishMessage', ({ topic, message, storeMessage }) => {
        mqttClient.publish(topic, message, (err) => {
            if (err) console.error(`Publish failed for ${topic}:`, err.message);
            else {
                console.log(`Published to ${topic}: ${message}`);
                // Store the message only if the checkbox is ticked
                if (storeMessage) {
                    insertMessageToDatabaseMySQL(topic, message);
                    insertMessageToDatabaseMongo(topic, message);
                }
            }
        });
    });
});

function insertMessageToDatabaseMySQL(topic, message) {
    try {
        // Remove "Message: " prefix if it exists
        const cleanedMessage = message.replace(/^Message: /, '');

        let query = '';
        let values = [];

        if (topic === 'soc/feeds/Solvierone') {
            // Handle messages for Arduino table
            const istTimestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

            // Convert to MySQL-compatible format (YYYY-MM-DD HH:mm:ss)
            const mysqlTimestamp = new Date(istTimestamp).toISOString().slice(0, 19).replace('T', ' ');

            query = `INSERT INTO Arduino (message, timestamp) VALUES (?, ?)`;
            values = [cleanedMessage, mysqlTimestamp];
        } else {
            let msg;
            try {
                // Parse the cleaned message into JSON
                msg = JSON.parse(cleanedMessage);
            } catch (parseError) {
                console.error('Error parsing message:', parseError.message);
                return; // Exit if message can't be parsed
            }

            if (msg.TYPE === 'IO') {
                // Extract fields for IO type
                query = `INSERT INTO messages (type, id, DT, AI1, AI2, DI1, DI2, DO1, sdtotal, sdavail, ifb, gsm, wifi, coordinate, timestamp) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    
                values = [
                    msg.TYPE,
                    msg.ID,
                    msg.DT,
                    parseFloat(msg.DATA.AI1),    // Analog Input 1
                    parseFloat(msg.DATA.AI2),    // Analog Input 2
                    parseInt(msg.DATA.DI1, 10),  // Digital Input 1
                    parseInt(msg.DATA.DI2, 10),  // Digital Input 2
                    parseInt(msg.DATA.DO1, 10),  // Digital Output 1
                    msg.Info?.SDTOTAL || null,   // SD Total
                    msg.Info?.SDAVAIL || null,   // SD Available
                    msg.Info?.IFB || null,       // IFB
                    msg.Info?.GSM || null,       // GSM
                    msg.Info?.WIFI || null,      // WIFI
                    msg.Info?.CORDINATE || null  // Coordinate
                ];
            } else if (msg.TYPE === 'MODBUS') {
                // Extract fields for MODBUS type
                query = `INSERT INTO messages (type, id, DT, qno, timestamp) 
                         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;

                values = [
                    msg.TYPE,
                    msg.ID || null,
                    msg.DT || null,
                    msg.QNO || null
                ];
            } else {
                console.error(`Unknown message type: ${msg.TYPE}`);
                return; // Exit for unknown message types
            }
        }

        // Execute MySQL query
        dbMySQL.query(query, values, (err, result) => {
            if (err) {
                console.error('Error storing message in MySQL:', err.message);
            } else {
                console.log('Message stored in MySQL successfully');
            }
        });
    } catch (error) {
        console.error('Unexpected error in insertMessageToDatabaseMySQL:', error.message);
    }
}

// Function to insert message into MongoDB
function insertMessageToDatabaseMongo(topic, message) {
    if (!dbMongo) {
        console.error('MongoDB connection not ready. Message not stored.');
        return;
    }

    const collection = dbMongo.collection('messages');
    const messageDoc = {
        topic,
        message,  // The message can be a string or an object. If it's an object, it will be stored as JSON
        timestamp: new Date().toISOString(),
    };

    collection.insertOne(messageDoc, (err, result) => {
        if (err) {
            console.error('Error storing message in MongoDB:', err);
        } else {
            console.log('Message stored in MongoDB');
        }
    });
}

app.get('/views/mysql-data', (req, res) => {
    const query = 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100'; // Modify as needed
    dbMySQL.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching MySQL data:', err);
            res.status(500).send('Error fetching data');
        } else {
            res.render('mysql-data', { messages: results }); // Pass the results to the view
        }
    });
});

// Serve MongoDB data view
app.get('/views/mongo-data', (req, res) => {
    const collection = dbMongo.collection('messages');
    collection.find({}).sort({ timestamp: -1 }).limit(100).toArray((err, results) => {
        if (err) {
            console.error('Error fetching MongoDB data:', err);
            res.status(500).send('Error fetching data');
        } else {
            res.render('mongo-data', { messages: results }); // Pass the results to the view
        }
    });
});

// Endpoint to delete all messages from MySQL
app.delete('/api/messages/mysql/deleteAll', (req, res) => {
    dbMySQL.query('DELETE FROM messages', (err, result) => {
        if (err) {
            console.error('Error deleting messages from MySQL:', err);
            res.status(500).send({ success: false, message: 'Failed to delete messages from MySQL' });
        } else {
            console.log('All messages deleted from MySQL');
            res.send({ success: true, message: 'All messages deleted from MySQL' });
        }
    });
});

// Endpoint to delete all messages from MySQL
app.delete('/api/messages/arduino/deleteAll', (req, res) => {
    dbMySQL.query('DELETE FROM Arduino', (err, result) => {
        if (err) {
            console.error('Error deleting messages from MySQL:', err);
            res.status(500).send({ success: false, message: 'Failed to delete messages from MySQL' });
        } else {
            console.log('All messages deleted from MySQL');
            res.send({ success: true, message: 'All messages deleted from MySQL' });
        }
    });
});

// Serve the index.html file (main dashboard)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'views' , 'front-pg.html'));
});

// Start the server
server.listen(3000, () => console.log('Server running on http://192.168.0.137:3000'));
// server.listen(3000, () => console.log('Server running on http://localhost:3000'));
