const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Configuration MongoDB
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'kafka_messages';
const collectionName = 'messages';

// Middleware pour parser le JSON
app.use(express.json());

// Route pour récupérer tous les messages
app.get('/messages', async (req, res) => {
    const client = new MongoClient(mongoUrl);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const messages = await collection.find().sort({ timestamp: -1 }).toArray();
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        await client.close();
    }
});

// Route pour récupérer un message par ID
app.get('/messages/:id', async (req, res) => {
    const client = new MongoClient(mongoUrl);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const message = await collection.findOne({ _id: new require('mongodb').ObjectId(req.params.id) });
        
        if (!message) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        
        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        await client.close();
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`API disponible sur http://localhost:${port}`);
});