const functions = require("firebase-functions");
const express = require("express");
const { SitemapStream, streamToPromise } = require("sitemap");

const app = express();

app.get("/sitemap.xml", async (req, res) => {
    const smStream = new SitemapStream({
        hostname: "https://zema-hukuk.web.app"
    });

    smStream.write({ url: "/", priority: 1.0 });
    smStream.write({ url: "/hakkimizda", priority: 0.8 });
    smStream.write({ url: "/hizmetler", priority: 0.9 });
    smStream.write({ url: "/ekibimiz", priority: 0.7 });
    smStream.write({ url: "/iletisim", priority: 0.8 });

    // Bloglar Firestore'dan çekilebilir
    // blogSnapshot.forEach(doc => {
    //   smStream.write({ url: `/blog/${doc.id}`, priority: 0.6 });
    // });

    smStream.end();

    const sitemapOutput = await streamToPromise(smStream);
    res.header("Content-Type", "application/xml");
    res.send(sitemapOutput.toString());
});

exports.app = functions.https.onRequest(app);