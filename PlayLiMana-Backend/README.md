# THIS IS OUTDATED!!!

# PlayLiMana – Fullstack Application Setup Guide
Welcome to the **PlayLiMana Project**! This repository contains a full-stack application including a Quarkus backend, an Angular frontend, and observability tools such as Prometheus, Grafana, Jaeger, and OpenTelemetry Collector.

## Folder Structure
Here is an overview of the project structure:

```
project-root/
├── PlayLiMana-Backend/           # Quarkus backend
|   ├── docker-compose.yml # Compose file for Quarkus app and Database
|   ├── docker-compose.observability.yml # Compose file for Observability stack
|   └── .env                          # Environment variables for backend & frontend
├── PlayLiMana-Frontend/          # Angular frontend
```

## Getting Started

Follow these steps to set up and run the backend, frontend, and observability tools.

### Prerequisites

Make sure you have the following installed on your system:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js and npm](https://nodejs.org/en/download/) (for the Angular frontend)
- [Angular CLI](https://angular.io/cli) (install using `npm install -g @angular/cli`)


## Step 1: Clone the Repository

Clone this repository to your local machine:

```bash
git clone <repository-url>
cd project-root
```

---

## Step 2: Start the Backend and Database

The backend and database are managed via Docker Compose. Use the `docker-compose.yml` file to start them.

1. Start the backend (`playlimana`) and the database (`playlimana-db`):

   ```bash
   docker-compose -f docker-compose.yml up --build
   ```

2. Verify that the backend is running on [http://localhost:9000](http://localhost:9000).

3. The PostgreSQL database data is stored persistently in a Docker volume.

---

## Step 3: Start the Observability Stack

The observability tools (Prometheus, Grafana, OpenTelemetry Collector, and Jaeger) are configured in a separate Compose file: `docker-compose.observability.yml`.

1. Start the observability stack by running both Compose files together:

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.observability.yml up --build
   ```

2. Access the observability tools via their respective URLs:
   - **Grafana**: [http://localhost:3000](http://localhost:3000)
   - **Prometheus**: [http://localhost:9090](http://localhost:9090)
   - **Jaeger UI**: [http://localhost:16686](http://localhost:16686)

3. OpenTelemetry Collector listens on:
   - **gRPC**: `localhost:4317`
   - **HTTP**: `localhost:4318`


   docker-compose -f docker-compose.yml -f docker-compose.observability.yml up -d


---

## Step 4: Start the Frontend

The frontend is an Angular application located in the `PlayLiMana-Frontend/` directory. It is started using the `ng serve` command.

1. Navigate to the frontend directory:

   ```bash
   cd PlayLiMana-Frontend
   ```

2. Install dependencies (if you have not done so already):

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   ng serve
   ```

4. Access the frontend in your browser at [http://localhost:4200](http://localhost:4200).

---

## Useful Commands

docker network create playlimana_net


Here are some additional tips and commands for managing the project's Docker containers and accessing logs.

### Viewing Container Logs

To view the logs of a specific container, use the following command:

```bash
docker logs <container-name>
```

For example:
- To view backend logs: `docker logs playlimana`
- To view database logs: `docker logs playlimana-db`

### Restarting Containers

To restart the containers, use the following commands:

1. Stop the running containers:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.observability.yml down
   ```

2. Start them again:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.observability.yml up --build
   ```

### Stopping Containers

To stop all running containers without deleting their states:

```bash
docker-compose -f docker-compose.yml -f docker-compose.observability.yml stop
```

---

## Ports and Access URLs

Here’s a summary of the ports and their respective services:

| Service            | Port      | URL                                 |
|---------------------|-----------|-------------------------------------|
| **Backend**         | 9000      | [http://localhost:9000](http://localhost:9000) |
| **Frontend**        | 4200      | [http://localhost:4200](http://localhost:4200) |
| **Grafana**         | 3000      | [http://localhost:3000](http://localhost:3000) |
| **Prometheus**      | 9090      | [http://localhost:9090](http://localhost:9090) |
| **Jaeger UI**       | 16686     | [http://localhost:16686](http://localhost:16686) |
| **OTEL Collector**  | 4317/4318 | - gRPC: `localhost:4317` / HTTP: `localhost:4318` |

---

## Environment Variables

The `.env` file contains important configuration values such as the frontend and backend URLs. Make sure it is properly set up before starting the application.

---

## Troubleshooting

- If the containers fail to start, check the logs for errors using `docker logs <container-name>`.
- Make sure no other services are running on the same ports to avoid conflicts.
- If you make changes to the backend code, rebuild the image before restarting the containers:
  ```bash
  docker-compose -f docker-compose.yml build
  ```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
```
Speichern Sie diese Datei unter `README.md` im Projektverzeichnis. Diese README-Datei bietet eine klare Anleitung für Benutzer*innen und deckt alle notwendigen Schritte ab.
```

## Quarkus

This project uses Quarkus, the Supersonic Subatomic Java Framework.

If you want to learn more about Quarkus, please visit its website: <https://quarkus.io/>.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./gradlew quarkusDev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./gradlew build
```

It produces the `quarkus-run.jar` file in the `build/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `build/quarkus-app/lib/` directory.

The application is now runnable using `java -jar build/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./gradlew build -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar build/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script
./gradlew build -Dquarkus.native.enabled=true
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./gradlew build -Dquarkus.native.enabled=true -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./build/playlimana-1.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/gradle-tooling>.

## Related Guides

- REST ([guide](https://quarkus.io/guides/rest)): A Jakarta REST implementation utilizing build time processing and
  Vert.x. This extension is not compatible with the quarkus-resteasy extension, or any of the extensions that depend on
  it.

## Provided Code

### REST

Easily start your REST Web Services

[Related guide section...](https://quarkus.io/guides/getting-started-reactive#reactive-jax-rs-resources)
