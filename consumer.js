const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

// Configuration Kafka
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});

// Configuration MongoDB
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'kafka_messages';
const collectionName = 'messages';

const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
    // Connexion à MongoDB
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Connexion à Kafka
    await consumer.connect();
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
    
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const messageContent = message.value.toString();
            console.log({
                value: messageContent,
            });
            
            // Enregistrement dans MongoDB
            try {
                await collection.insertOne({
                    message: messageContent,
                    topic: topic,
                    partition: partition,
                    timestamp: new Date()
                });
                console.log('Message enregistré dans MongoDB');
            } catch (err) {
                console.error('Erreur MongoDB:', err);
            }
        },
    });
};

run().catch(async (error) => {
    console.error(error);
    process.exit(1);
});