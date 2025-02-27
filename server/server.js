import express from 'express';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';// This library generates unique short IDs

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/urlShortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("Could not connect to MongoDB", err));

// Define the schema for URL mapping
const urlSchema = new mongoose.Schema({
    longUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true }
});

const Url = mongoose.model('Url', urlSchema);

// Endpoint to shorten a URL
app.post("/shorten", async (req, res) => {
    const { longUrl } = req.body;

    // Validate URL format
    const urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([a-zA-Z0-9]{1,256}\.)?[a-zA-Z0-9]{1,64}\.[a-zA-Z]{2,6}(\/[\w\-.~:/?#[\]@!$&'()*+,;=]*)?$/;
    if (!urlRegex.test(longUrl)) {
        return res.status(400).send("Invalid URL");
    }

    try {
        // Check if the URL has already been shortened
        let existingUrl = await Url.findOne({ longUrl });
        if (existingUrl) {
        return res.json({ shortUrl: `http://localhost:3000/${existingUrl.shortUrl}` });
        }

        // Create a new short URL using nanoid
        const shortUrl = nanoid(7); // Generate a unique 7-character string
        const newUrl = new Url({ longUrl, shortUrl });

        // Save to database
        await newUrl.save();

        res.json({ shortUrl: `http://localhost:3000/${shortUrl}` });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

// Endpoint to redirect to the original URL
app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const url = await Url.findOne({ shortUrl });
        if (!url) {
        return res.status(404).send("URL not found");
        }

        res.redirect(url.longUrl);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
