=======================================================================

#Introduction

This project is a webpage designed to display real-time data sent from an IoT device to a server via an MQTT broker.

Key Features:

  - Live Data Display: View real-time data on the webpage as it is sent from the IoT device.
  - Filtering: Filter data based on topics or other criteria.
  - Multi-Database Support: Seamlessly switch between MongoDB and MySQL for viewing and interacting with data.
  - Topic Management: Create your own MQTT topics to publish and subscribe to messages.
  - Data Export: Download the received messages in various formats including CSV, TXT, and JSON.
  - Web Technologies Used: Built using HTML, CSS, and JavaScript to provide a simple and responsive interface.
  - IoT Integration: The project is designed to work with IoT devices that use MQTT for communication.

This README file contains all the necessary information to set up and run the project, including installation instructions, dependencies, and configuration steps.

=======================================================================

# Installation of Libraries

To set up the required libraries, run the following commands:

npm install node
npm init -y
npm install mqtt express socket.io
npm install mysql2
npm install mongodb

=======================================================================

# Setting Up MySQL

1. Download MySQL
   - Go to the official [MySQL download page](https://dev.mysql.com/downloads/).
   - Choose the appropriate version for your operating system and download the installer.
   - Follow the installation instructions to complete the setup.

2. Create a MySQL Connection
   - After installing MySQL, you need to create a connection to the database.
   - Open MySQL Workbench or use the command line to create a connection.
   - Provide the following details:
     - Host: `localhost` (or your MySQL server's IP address)
     - User: `root` (or a custom username if you created one during the installation)
     - Password: The password you set during installation

3. Create a Database
   - Once connected, open a new SQL tab and run the following command to create a new database for the project:
     ```sql
     CREATE DATABASE `MODEM`;
     ```
   - This will create a database named `MODEM`.

4. Create a Table for Messages
   - Switch to the `MODEM` database by running the following:
     ```sql
     USE MODEM;
     ```
   - Then, create a table called `messages` with the following structure:
     ```sql
    CREATE TABLE MESSAGES (
    UID INT AUTO_INCREMENT PRIMARY KEY,      
    type VARCHAR(255),                        
    id VARCHAR(255),                          
    DT INT,                                   
    AI1 FLOAT,                                
    AI2 FLOAT,                               
    DI1 INT,                                  
    DI2 INT,                                  
    DO1 INT,                                  
    sdtotal VARCHAR(255),                     
    sdavail VARCHAR(255),                     
    ifb VARCHAR(255),                         
    gsm VARCHAR(255),                         
    wifi VARCHAR(255),                        
    coordinate VARCHAR(255),                  
    qno INT,                                  
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP 
    );

    CREATE TABLE Arduino (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    message VARCHAR(255) NOT NULL,     
    timestamp DATETIME NOT NULL        
    );
     ```

5. Configure MySQL Connection in `server.js`
   - Open the `server.js` file in the project directory.
   - Locate the MySQL connection configuration section and update the following details:
     - host: `localhost` (or the IP address of your MySQL server)
     - user: `root` (or your custom MySQL username)
     - password: The password you set during MySQL installation
     - database: `MODEM` (the name of the database you just created)
   
   Example configuration:
   ```js
   const dbMySQL = mysql.createConnection({
       host: 'localhost',  // MySQL server address
       user: 'root',       // MySQL username
       password: 'your_password',  // MySQL password
       database: 'MODEM',  // MySQL database name
       port: 3306,  // MySQL default port
   });
   ```

6. Test the Connection
   - Save your changes and run the project to check if the connection to MySQL is established successfully.

=======================================================================

# Setting Up MongoDB

1. Download MongoDB
   - Go to the official [MongoDB download page](https://www.mongodb.com/try/download/community).
   
2. Start MongoDB
   - Once installed, you can start MongoDB by running:
     ```bash
     mongod
     ```
   - MongoDB will start running on the default port `27017`. You can now access the MongoDB shell by running:
     ```bash
     mongo
     ```

3. Create a Database
   - In the MongoDB shell (`mongo`), create a database for the project. MongoDB will automatically create the database when you first use it:
     ```javascript
     use MODEM;
     ```
   - This will switch to a database called `MODEM`. If the database doesn't exist, MongoDB will create it when you insert the first document.

4. Create a Collection for Messages
   - In MongoDB, a collection is equivalent to a table in MySQL. To create a collection for messages, run the following:
     ```javascript
     db.createCollection('messages');
     ```
   - This will create a collection called `messages` within the `MODEM` database.

=======================================================================

# Setting Up the Mosquitto Broker

1. Download Mosquitto (https://mosquitto.org/download/)
1. Open the file explorer and locate the Mosquitto folder.
2. Search for the `mosquitto.conf` file within the folder.
3. Open the `mosquitto.conf` file as an administrator.
4. Add the following lines at the end of the file:

   listener 1883
   allow_anonymous true

5. Save the changes.
6. Open command prompt and paste this 
   net stop mosquitto
   mosquitto -v -c "C:\Program Files\mosquitto\mosquitto.conf"
   net stop mosquitto
   net start mosquitto 

To test connection paste this in cmd 
   netstat -an | findstr 1883

Or use powershell
   Test-NetConnection -ComputerName 192.168.0.137 -Port 1883

To see if your port is open on public ip visit https://www.canyouseeme.org/ and enter your public ip with port number 1883

=======================================================================

# Changes in the mqttServer.js File

1. Change `const brokerUrl` to the IP address of your device.
   - To check the IP address of your device:
     - Open Command Prompt.
     - Type `ipconfig`.
     - Check the IPv4 address and copy it.
   - Replace the placeholder in `brokerUrl` with your IPv4 address.
   - or use localhost

2. Update the `server.listen` link to use the same IP address.

These changes are necessary for port forwarding.

=======================================================================

# Configuring Port Forwarding

1. Open your browser and enter your IPv4 address, changing the last digit to `1`.
   - Example: `XXX.XXX.X.1`.
2. Look for the port forwarding settings in your router configuration.
3. Set the internal and external port to the port you are using (e.g., 1883).
4. Set the internal IP to your device's IP address.
5. Save the changes.

=======================================================================

# Running the Code

To run the code, execute the following command in your terminal:

node mqttServer.js

=======================================================================
