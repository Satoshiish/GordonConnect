const fs = require('fs');
const { google } = require('googleapis');

const apikey = require('./apikey.json');

const SCOPE = ['https://www.googleapis.com/auth/drive'];
async function authorize() {
    const jwtClient = new google.auth.JWT(
        apikey.client_email,
        null,
        apikey.private_key,
        SCOPE
    );
    await jwtClient.authorize();
    return jwtClient;
}

async function uploadImage(authClient, imagePath, imageName) {
    return new Promise((resolve, reject) => {
        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetaData = {
            name: imageName,  // Image file name
            parents: ["1My6PWdHdU9Xz4lkJtRzjSVy1DybBk4DE"], // Folder ID in Google Drive
        };

        drive.files.create({
            resource: fileMetaData,
            media: {
                body: fs.createReadStream(imagePath), // Read image file
                mimeType: 'image/jpeg' // Change MIME type based on the image format (e.g., image/png)
            },
            fields: 'id'
        }, function (err, file) {
            if (err) {
                return reject(err);
            }
            resolve(file.data.id);
        });
    });
}

// Example: Upload an image
const imagePath = 'image.jpg';  // Change this to your image file path
const imageName = 'uploaded_image.jpg'; // Name of the image in Google Drive

authorize()
    .then(authClient => uploadImage(authClient, imagePath, imageName))
    .then(fileId => console.log(`Image uploaded successfully. ID: ${fileId}`))
    .catch(err => console.error("Upload failed:", err));
