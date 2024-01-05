# documatic
Generate a Google Doc from a template

## System requirements
- Node
- npm package manager
- New Google Cloud project with an OAuth 2.0 client

## Run the application
- `npm install` to install dependencies
- Add Google OAuth client credentials to a `.env` file saved in root directory
  ```
  # .env
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  ```
- Build client bundle with one of the following:
  - `npm run build-dev`
  - `npm run build-watch`
  - `npm run build-prod`
- Start server with one of the following:
  - `npm run start-dev`
  - `npm run start-prod`
  - Optionally define environment variable `PORT` (defaults to 3000)
- Navigate to http://localhost:3000

## Testing
- `npm test`

## Linting
- `npm run lint`

## Deployment
### System requirements
- Docker

### First-time setup
1. In the Google project's Artifact Registry, create new Docker image repository called `documatic`
    - Take note of the repository's host name (such as `us-west1-docker.pkg.dev`)
2. In the Google project, create two service accounts
    - Service account named `push-docker-images` with the `Artifact Registry Writer` role and a private key. Save the private key
    - Service account named `run-documatic` with the `Secret Manager Secret Accessor` role and `Cloud Run Admin` role
3. Add contents of local `.env` file to the Google project's Secret Manager
4. Authenticate to the repository
    - [Install Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
    - `source .zshrc`
    - `gcloud init` (choose this app's Google project)
    - `gcloud auth login`
    - `gcloud auth activate-service-account <service_account> --key-file=<path_to_key_file>`
      - Use the `push-docker-images` service account and its private key
      - `gcloud iam service-accounts list` can be used to get the exact service account name
    - `gcloud auth configure-docker <repository_host_name_from_step_1>`
5. Build, tag, and push image to repository
    - `docker build -t documatic .`
    - `docker tag <image_id> <repository_host_name_from_step_1>/<project_id>/documatic/documatic`
    - `docker push <repository_host_name_from_step_1>/<project_id>/documatic/documatic`
6. Deploy container with Google Cloud Run
    - Click "Create service" in Google project's Cloud Run console
    - Select container image
    - Allow direct access to service from the internet
    - Allow unauthenticated invocations
    - Enter container port used in the Dockerfile
    - Click "reference a secret" for the two client credentials saved in Secret Manager
7. Navigate to the generated URL
8. Can use Cloud Run Domain Mappings to map to a custom domain name

### Subsequent deployments
1. Build, tag, and push new image to Artifact Registry
2. In Google Cloud Run, select the service
3. Click "Edit & Deploy New Revision" and select the target container image
4. Click "Deploy"

### Other helpful commands
| | |
|-|-|
| `docker run --env-file .env documatic:latest` | Create a container from the image and run it |
| `docker container ps` | Get running container name |
| `docker exec -it <container_name> sh` | Explore container filesystem |
| `docker container stop <container_name>` | Stop the container |
| `docker container prune` | Delete stopped containers |
| `docker rmi <image_name_or_id>` | Delete an image |
