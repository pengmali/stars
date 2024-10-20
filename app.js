const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const AWS = require("aws-sdk"); // Amazon Polly

const app = express();
app.use(cors());

const port = 3000;

// Set up AWS Polly credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1", // Or the region you're using
});

const polly = new AWS.Polly();

// Helper function to split the text into 3000-character chunks
function splitText(text, maxLength = 3000) {
  const parts = [];
  let currentPart = "";

  text.split(" ").forEach((word) => {
    if (currentPart.length + word.length + 1 <= maxLength) {
      currentPart += word + " ";
    } else {
      parts.push(currentPart.trim());
      currentPart = word + " ";
    }
  });

  parts.push(currentPart.trim()); // Push the last part
  return parts;
}

// Endpoint to scrape content and convert to speech
app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let articleText = "";
    $("p").each((index, element) => {
      articleText += $(element).text() + "\n";
    });

    if (!articleText) {
      return res.status(400).send("No text found to convert to speech");
    }

    // Split the text into chunks if it exceeds Polly's limit
    const textChunks = splitText(articleText);

    // Process each chunk with Polly and combine the results
    const audioBuffers = [];
    for (const chunk of textChunks) {
      const pollyParams = {
        Text: chunk,
        OutputFormat: "mp3",
        VoiceId: "Joanna",
      };

      // Polly synthesis speech for each chunk
      const { AudioStream } = await polly
        .synthesizeSpeech(pollyParams)
        .promise();
      audioBuffers.push(AudioStream);
    }

    // Concatenate all audio chunks into a single buffer
    const combinedAudio = Buffer.concat(audioBuffers);

    // Convert the final audio buffer into a base64 string
    const audioContent = combinedAudio.toString("base64");

    // Send back the base64 audio string to the client
    res.json({ audioContent });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error scraping the website or generating speech");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
