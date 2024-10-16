const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config({ path: ".env.local" });
const app = express();

const uri = process.env.MONGO_URI;
const dbName = "leaderboard";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/leaderboard");
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/leaderboard.html"));
});

app.get("/placements", async (req, res) => {
    try {
        await client.connect();
        const database = client.db('leaderboard');
        const collection = database.collection('times');
        
        const placements = await collection.find().sort({ time: 1 }).toArray();
        res.status(200).send({ placements: placements });
    } catch (error) {
        console.error(err);
        res.status(500).send({ message: 'Error retreiving data from database' });
    } finally {
        await client.close()
    }
});

app.post('/receive_time', async (req, res) => {
    const { name, time } = req.body;
    console.log(`body of request: ${name}, ${time}`);
    if (!name || !time) {
        return res.status(400).send({ message: 'Name and time are required' });
    }
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('times');
        const result = await collection.insertOne({
            name: name,
            time: time,
        });
        console.log(`Successfully inserted document with _id: ${result.insertedId}`);
        res.status(200).send({ message: 'Time received' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error saving data to database' });
    } finally {
        await client.close()
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
