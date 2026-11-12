import express from "express";
import { setupDirectories, downloadRawVideo, uploadProcessedVideo, convertVideo, deleteRawVideo, deleteProcessedVideo } from "./storage"

setupDirectories();

const app = express();
const port = process.env.PORT || 3000
app.use(express.json())
app.post("/process-video", async (req, res) => {
    // Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString("utf8");
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("Invalid message payload recieved.");
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send("Bad Request: missing file name.")
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw video from Cloud Storage
    await downloadRawVideo(inputFileName);

    // Convert the video to 360p
    try {
        await convertVideo(inputFileName, outputFileName)
    } catch(err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.log(err)
        return res.status(500).send("Internal Server Error: video processing failed.")
    }

    // Upload the processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send("Processing finished successfully");
})

app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
})