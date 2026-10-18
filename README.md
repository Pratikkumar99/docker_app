# Docker Practical Notes: MongoDB + Mongo Express

## Step 1: Verify Docker installation

Open CMD or PowerShell.

```bash
docker --version
docker ps
```

- `docker --version` checks the installed Docker version.
- `docker ps` lists currently running containers.
- Docker Desktop must be running before executing Docker commands.

## Step 2: Create a Docker network

```bash
docker network create test-network
```

**Why?** A Docker network allows containers to communicate with each other using their container or service names.

Verify it:

```bash
docker network ls
```

## Step 3: Run MongoDB

```bash
docker run -d --name test-mongo --network test-network -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=pass -v mongo-data:/data/db mongo:8
```

### Understanding the command

| Option                   | Meaning                                      |
| ------------------------ | -------------------------------------------- |
| `docker run`             | Creates and starts a container               |
| `-d`                     | Runs the container in the background         |
| `--name test-mongo`      | Assigns a container name                     |
| `--network test-network` | Connects it to the Docker network            |
| `-p 27017:27017`         | Maps host port 27017 to container port 27017 |
| `-e`                     | Sets an environment variable                 |
| `-v mongo-data:/data/db` | Persists database files in a named volume    |
| `mongo:8`                | Specifies the MongoDB image                  |

Check the container:

```bash
docker ps
docker logs test-mongo
```

## Step 4: Run Mongo Express

```bash
docker run -d --name test-mongo-express --network test-network -p 8081:8081 -e ME_CONFIG_MONGODB_URL="mongodb://root:example123@test-mongo:27017/?authSource=admin" -e ME_CONFIG_BASICAUTH_ENABLED=true -e ME_CONFIG_BASICAUTH_USERNAME=admin -e ME_CONFIG_BASICAUTH_PASSWORD=pass mongo-express:1
```

Open:

[http://localhost:8081](http://localhost:8081)

Login:

- Username: `admin`
- Password: `password`

Mongo Express is a web-based interface for viewing and managing MongoDB databases.

**Important:** Inside the Docker network, Mongo Express connects using `test-mongo:27017`, not `localhost:27017`.

## Step 5: Create the Node.js project locally

```bash
mkdir docker-mongo-test
cd docker-mongo-test
npm init -y
npm install express mongoose
```

Project structure:

```text
docker-mongo-test/
├── server.js
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

- Express creates the backend API.
- Mongoose connects the application to MongoDB.
- HTML defines the frontend structure.
- CSS styles the frontend.
- JavaScript sends HTTP requests using `fetch()`.

## Step 6: Connect the local backend to MongoDB

Use this MongoDB connection string in `server.js`:

```javascript
mongodb://root:pass@localhost:27017/testdb?authSource=admin
```

Why `localhost`?

The Node.js application runs on your computer, outside Docker. Therefore, it connects through the host port published with `-p 27017:27017`.

The `testdb` database is created when MongoDB first stores data in it.

## Step 7: Create the user model

```javascript
const User = mongoose.model("User", {
  name: String,
  email: String
});
```

This defines a Mongoose model that represents user documents in MongoDB.

By default, Mongoose uses the `users` collection for the `User` model.

## Step 8: Create the backend APIs

### Create a user

```javascript
app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- `POST` sends new user data.
- `req.body` contains the submitted data.
- `User.create()` saves it to MongoDB.
- `201` indicates successful resource creation.

### Get all users

```javascript
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- `GET` retrieves data.
- `User.find()` fetches all user documents.
- `res.json()` sends the results to the frontend.

Make sure these middlewares are declared before the routes:

```javascript
app.use(express.json());
app.use(express.static("public"));
```

## Step 9: Connect the frontend to Express

Use relative URLs in `public/script.js`:

```javascript
fetch("/api/users");
```

To create a user:

```javascript
fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Pratik",
    email: "pratik@example.com"
  })
});
```

The frontend uses `fetch()` to communicate with Express. Express communicates with MongoDB.

## Step 10: Start and test the application

Start the local backend:

```bash
node server.js
```

Open the frontend:

[http://localhost:3000](http://localhost:3000)

Test these URLs:

| URL                               | Purpose                 |
| --------------------------------- | ----------------------- |
| `http://localhost:3000`           | Frontend                |
| `http://localhost:3000/api/users` | Get all users           |
| `http://localhost:8081`           | Mongo Express dashboard |

Create a user through the form, then verify the saved record in Mongo Express under `testdb` → `users`.

## Step 11: Verify Docker containers

```bash
docker ps
```

Expected containers:

- `test-mongo`
- `test-mongo-express`

The Node.js application is not listed because it runs locally.

Inspect network connections:

```bash
docker network inspect test-network
```

## Step 12: Stop, restart and remove containers

Stop containers:

```bash
docker stop test-mongo-express test-mongo
```

Restart existing containers:

```bash
docker start test-mongo test-mongo-express
```

View logs:

```bash
docker logs test-mongo
docker logs test-mongo-express
```

Remove containers:

```bash
docker rm -f test-mongo-express test-mongo
```

Remove the network after disconnecting/removing its containers:

```bash
docker network rm test-network
```

The `mongo-data` volume remains unless you explicitly remove it.

**Warning:** Removing the volume deletes the persistent database data.

## Important Docker concepts

### Image vs container

- Image: a template used to create containers, such as `mongo:8`.
- Container: a running instance of an image, such as `test-mongo`.

### Port mapping

`-p 27017:27017` means host port 27017 forwards traffic to container port 27017.

### Docker network

Containers attached to the same network can communicate by container name.

### Volume

A volume stores database files independently of the container lifecycle.

### Environment variables

`-e KEY=value` passes configuration into a container.

### Docker Compose

Docker Compose can manage multiple containers from one configuration file. This project deliberately uses individual `docker run` commands instead.

## Troubleshooting

**404 on `/api/users`:** Check that the frontend URL and Express route both use `/api/users`.

**MongoDB connection refused:** Check that the MongoDB container is running and port 27017 is published.

**Mongo Express cannot connect:** Check its logs and verify the MongoDB URL uses `test-mongo` as the hostname.

**Database data disappears:** Check whether the `mongo-data` volume was removed or whether a different volume was mounted.

**Port already in use:** Stop the application using the port or choose another available host port.

## Security reminder

These credentials are for local learning only. Do not expose this configuration publicly. Production applications should use secure secrets and a dedicated least-privilege database user instead of MongoDB's root account.

## Final revision checklist

- Docker installation verified
- Network created
- MongoDB container started
- Mongo Express container started
- Local Node.js app connected to MongoDB
- User creation tested
- User retrieval tested
- Database verified in Mongo Express
- Volume persistence understood
- Docker networking understood
