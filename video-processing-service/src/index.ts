import express from "express";
import ffmpeg from "fluent-ffmpeg"

const app = express();
const port = process.env.PORT || 3000
app.use(express.json())
app.post("/process-video", (req, res) => {
    console.log("--- NEW REQUEST RECEIVED ---");
    console.log("Body:", JSON.stringify(req.body));
    // get path of the input video
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath) {
        if (!inputFilePath) {
            return res.status(400).send("Bad Request: Missing input file path.")
        } else if (!outputFilePath) {
            return res.status(400).send("Bad Request: Missing output file path.")
        } else {
            return res.status(400).send("Bad Request: Missing input and output file paths.")
        }
    }

    ffmpeg(inputFilePath)
    .outputOptions("-vf", "scale=640:360")
    .on("end", () => {
        res.status(200).send("Video processing finished successfully.");
    })
    .on("error", (err) => {
        console.log(`An error occurred: ${err.message}`)
        res.status(500).send(`Internal Server Error: ${err.message}`)
    })
    .save(outputFilePath);
})

app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
})