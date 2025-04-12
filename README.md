# Kafka Integration with Node.js

This repository contains the implementation for TP6: Integration and Manipulation of Data with Apache Kafka. The project demonstrates how to use Apache Kafka with Node.js for message production and consumption, along with database integration and API development.

## Objectives

- Gain practical skills in data stream management with Apache Kafka
- Learn to integrate Kafka with Node.js applications for producing and consuming messages
- Configure a database to store messages from Kafka
- Create a REST API to retrieve stored messages

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [Apache Kafka](https://kafka.apache.org/downloads) (Version 3.9.0)
- [Apache ZooKeeper](https://kafka.apache.org/downloads) (Included with Kafka)
- [MongoDB](https://www.mongodb.com/try/download/community) or [PostgreSQL](https://www.postgresql.org/download/)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/kafka-nodejs-integration.git
cd kafka-nodejs-integration
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Kafka and ZooKeeper

#### Start ZooKeeper
```bash
# On Linux/macOS
bin/zookeeper-server-start.sh config/zookeeper.properties

# On Windows
bin\windows\zookeeper-server-start.bat config\zookeeper.properties
```

#### Start Kafka
```bash
# On Linux/macOS
bin/kafka-server-start.sh config/server.properties

# On Windows
bin\windows\kafka-server-start.bat config\server.properties
```

#### Create a Kafka Topic
```bash
# On Linux/macOS
bin/kafka-topics.sh --create --partitions 1 --replication-factor 1 --topic test-topic --bootstrap-server localhost:9092

# On Windows
bin\windows\kafka-topics.bat --create --partitions 1 --replication-factor 1 --topic test-topic --bootstrap-server localhost:9092
```

### 4. Configure the database

Create a `.env` file in the root directory with your database configuration:

```
# For MongoDB
MONGODB_URI=mongodb://localhost:27017/kafka_messages

# For PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kafka_messages
POSTGRES_USER=yourusername
POSTGRES_PASSWORD=yourpassword
```

## Project Structure

```
├── config/
│   └── db.js             # Database configuration
├── models/
│   └── message.js        # Database schema/model
├── routes/
│   └── api.js            # API routes
├── consumer.js           # Kafka consumer
├── producer.js           # Kafka producer
├── server.js             # Express server
└── package.json
```

## Usage

### 1. Start the producer

```bash
node producer.js
```

This will start sending messages to the Kafka topic every second.

### 2. Start the consumer

```bash
node consumer.js
```

The consumer will read messages from the Kafka topic and save them to the configured database.

### 3. Start the API server

```bash
node server.js
```

The API server will start on port 3000 (by default).

## API Endpoints

- `GET /api/messages` - Retrieve all messages stored in the database
- `GET /api/messages/:id` - Retrieve a specific message by ID

## Implementation Details

### Producer

The producer sends messages to the `test-topic` Kafka topic:

```javascript
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();
  setInterval(async () => {
    try {
      await producer.send({
        topic: 'test-topic',
        messages: [
          { value: 'Hello KafkaJS user!' },
        ],
      });
      console.log('Message produit avec succès');
    } catch (err) {
      console.error("Erreur lors de la production de message", err);
    }
  }, 1000);
};

run().catch(console.error);
```

### Consumer

The consumer reads messages from the Kafka topic and stores them in the database:

```javascript
const { Kafka } = require('kafkajs');
const Message = require('./models/message');
const db = require('./config/db');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
  // Connect to database
  await db.connect();
  
  // Connect to Kafka
  await consumer.connect();
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageValue = message.value.toString();
      console.log(`Received message: ${messageValue}`);
      
      // Save to database
      const newMessage = new Message({
        content: messageValue,
        topic,
        partition,
        timestamp: Date.now()
      });
      
      await newMessage.save();
      console.log('Message saved to database');
    },
  });
};

run().catch(console.error);
```

