// const dns = require("node:dns");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
require("dotenv").config();
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const app = express();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("mediqueue");
    const tutorsCollection = db.collection("tutors");
    const mytutorsCollection = db.collection("mytutors");
    const mybookedsessionCollection = db.collection("mybookedsession");

    app.get("/mytutors", verifyToken, async (req, res) => {
      const result = await mytutorsCollection.find().toArray();
      res.json(result);
    });

    app.post("/mytutors", verifyToken, async (req, res) => {
      const mytutorData = req.body;
      console.log(mytutorData);
      const result = await mytutorsCollection.insertOne(mytutorData);

      res.json(result);
    });
    app.patch("/mytutors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      console.log(updatedData);

      const result = await mytutorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.json(result);
    });

    app.delete("/mytutors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await mytutorsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get("/bookedSession", verifyToken, async (req, res) => {
      const result = await mybookedsessionCollection.find().toArray();
      res.json(result);
    });

    app.post("/bookedSession", verifyToken, async (req, res) => {
      const bookedSessionData = req.body;
      const result =
        await mybookedsessionCollection.insertOne(bookedSessionData);

      res.json(result);
    });

    app.patch("/bookedSession/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      console.log(updatedData);

      const result = await mybookedsessionCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.json(result);
    });

    // app.get("/tutors", async (req, res) => {
    //   const result = await tutorsCollection.find().toArray();
    //   res.json(result);
    // });
    app.get("/tutors", async (req, res) => {
      const { search, startDate, endDate } = req.query;

      let query = {};

      // 🔍 Name search (keep your existing logic)
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      // 📅 Date range filter
      if (startDate || endDate) {
        query.sessionStartDate = {};

        if (startDate) {
          query.sessionStartDate.$gte = new Date(startDate);
        }

        if (endDate) {
          query.sessionStartDate.$lte = new Date(endDate);
        }
      }

      const result = await tutorsCollection.find(query).toArray();
      res.json(result);
    });

    app.get("/tutors-six", async (req, res) => {
      const result = await tutorsCollection.find().limit(6).toArray();
      res.json(result);
    });
    // app.get("/tutors/:id", async (req, res) => {
    //   const result = await tutorsCollection.find().toArray();
    //   res.json(result);
    // });

    //middleware

    app.get("/tutors/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const tutor = await tutorsCollection.findOne(query);

      res.json(tutor);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running just fine!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
