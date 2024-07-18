const express = require('express');
const path=require('path');

const {open} = require('sqlite');
const sqlite3 = require('sqlite3');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

let cors = require('cors');
app.use(cors());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

// function to intialize database and server 
let intializeDatabaseAndServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log("Server running at http://localhost:3000/");
        })
    }
    catch(e){
        console.log(`DB Error:${e.message}`);
        process.exit(1);
    }
}

intializeDatabaseAndServer();



 // register user

app.post("/register/", async (request, response) => {
    const { username, password} = request.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
            INSERT INTO
                user ( username, password)
            VALUES
                (
                    '${username}',
                    '${hashedPassword}'
                );`;
        const dbResponse = await db.run(createUserQuery);
        response.status(200);
        response.send({ message: "User created successfully" });
     
    } else {
        response.status(400);
        
        response.send({errorMessage:"User already exists"});
    }

  });


// login user
  app.post("/login/", async (request, response) => {
    const { username, password } = request.body;

    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);


    if (dbUser === undefined) {
        response.status(400);
        
        response.send({ errorMessage:"Invalid user"})
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            const payload = {
                username: username,
            };
            const jwtToken = jwt.sign(payload, "MY_SECRET_KEY");
            response.send({ jwtToken: jwtToken });


        } else {
            response.status(400);
            response.send({errorMessage: "Invalid password" });
        }
    }

  });



  // create notes
  app.post("/notesAdd/", async (request, response) => {
    const { title, content,background_color,id } = request.body;

    const inesertingQuery = `INSERT INTO Notes (title,content,background_color,id) VALUES ('${title}','${content}','${background_color}','${id}');`;

    const dbResponse = await db.run(inesertingQuery);
    response.status(200);
    response.send("Note created successfully");
    

  });

  // get all notes
  app.get("/notesTaken/", async (request, response) => {
    const selectQuery = `SELECT * FROM Notes;`;
    const dbResponse = await db.all(selectQuery);
    response.status(200);
    response.send(dbResponse);

    });

    // get specific note
    app.get("/notesTaken/:id", async (request, response) => {
    const { id } = request.params;
    const selectQuery = `SELECT * FROM Notes WHERE id = ${id};`;
    const dbResponse = await db.get(selectQuery);
    response.status(200);
    response.send(dbResponse);
    });

    // delete each notes
    app.delete("/noteDelete/:id", async (request, response) => {
    const { id } = request.params;
    const deleteQuery = `DELETE FROM Notes WHERE id = ${id};`;
    const dbResponse = await db.run(deleteQuery);
    response.status(200);
    response.send("Note deleted successfully");
    });

    // update each notes
    app.put("/noteUpdate/:id", async (request, response) => {
    const { id } = request.params;
    const { title, content,background_color,is_archived,is_trashed } = request.body;
    const updateQuery = `UPDATE Notes SET title = '${title}', content = '${content}',background_color = '${background_color}',is_archived='${is_archived}',is_trashed='${is_trashed}' WHERE id = '${id}';`;
    const dbResponse = await db.run(updateQuery);
    response.status(200);
    response.send("Note updated successfully");
    });
   
   
   // search each notes
    app.get("/notesTakenSearch", async (request, response) => {

    const {title,content} = request.query;

    if (!title && !content) {
        response.status(400).send("At least one search parameter (title or content) is required");
        return;
    }
    const selectQuery = `SELECT * FROM Notes WHERE title LIKE '%${title}%' OR content LIKE '%${content}%';`;
    const dbResponse = await db.all(selectQuery);
    response.status(200);
    response.send(dbResponse);
    });
 
   


