require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
    console.log('Logging route');
    next();
};

const verifyToken = (req, res, next) => {
  console.log('Verifying token middleware', req.cookies);
  const token = req?.cookies?.token;

  if(!token){
    return res.status(404).send({message: 'Unauthorized : Token not found'});
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'Invalid token'});
    }
    req.user = decoded;
    next();  
  });

  
}




app.get('/', (req, res) => {
    res.send('Hello World!');
});

// user - jobPortal
// pass-  4Px0fWmSgbc9jLtL



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqi16.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    //db name
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplicationCollection = client.db('jobPortal').collection('job_Applications');


    // Auth Related APIs-- 
    app.post('/jwt',async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET , {expiresIn: '1h'});

      res.cookie('token', token, {httpOnly:true, secure:false})
      .send({success: true});

    }); // login








    //jpb related apis
    // get all data 
    app.get('/jobs', logger,  async (req, res) => {
      console.log('Now inside the api callback');
      const email= req.query.email;
      let query = {};
      if(email){
        query = {hr_email: email};
      }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
    });

    // specific data get
    app.get('/jobs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)};
        const result = await jobsCollection.findOne(query);
        res.send(result);
    });

    // Query parameter - example -> ? name=value&name=value
    // get all data , get one data, get some data [0,1, many]
    app.get('/job-application', verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = {applicant_email: email};
      console.log("cuk cuk cookies:  ",req.cookies);
      if(req.user.email !== req.user.email){
        return res.status(403).send({message: 'Forbiden access'});
      }

      

      const result = await jobApplicationCollection.find(query).toArray();

      for(const application of result) {
        console.log(application.job_id);
         const query1 = { _id: new ObjectId(application.job_id)};
         const job = await jobsCollection.findOne(query1);
        if(job){
          application.title = job.title;
          application.company = job.company;
          application.location = job.location;
          application.company_logo = job.company_logo;
        }
        
      }
      res.send(result);

    }); 

    // job application apis - create
    app.post('/job-applications', async (req, res) => { // first a server a /job-applications path create korsi then client side theke data pathanor jonno /job-applications a fetch korsi then post method use korsi (ApplyJob.jsx a ) 
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application)

      // Not the best way{use aggregate} try to skip
      const id= application.job_id;
      const query = { _id: new ObjectId(id)};
      const job = await jobsCollection.findOne(query);
      // console.log(job);
      let newCount = 0;
      if(job.applicationCount){
        newCount = job.applicationCount + 1;
      }
      else{
        newCount = 1;
      }
      // now update the job info
      const filter= { _id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          applicationCount: newCount
        },
      };

      const updateResult= await jobsCollection.updateOne(filter, updateDoc);


      res.send(result);
      
    });

    // add new job, creating a job
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    app.get('/job-applications/jobs/:job_id',async (req, res) => {
      const jobId = req.params.job_id;
      const query = {job_id: jobId};
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);
    }); // get all applications for a specific job

    app.patch('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: data.status
        },
      };
      const result = await jobApplicationCollection.updateOne(filter, updateDoc);
      res.send(result);
    }); // update a job application status





  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});