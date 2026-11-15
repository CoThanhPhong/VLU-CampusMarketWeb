### Building and running your application

Create `backend/.env` from `backend/.env.example`, then set `MONGO_URI` and a strong `JWT_SECRET`. Keep the populated `.env` file private.

When you're ready, start your application by running:
`docker compose up --build`.

The frontend will be available at http://localhost:5001, and the backend API at http://localhost:5000.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)