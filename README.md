![Attestation Kit](logo.png)

# Attestation Kit

Easily access Bloom's network of data verifiers to onboard users to your application/service. Or spin up a data verification service and get paid to verify information. Build up a reputation as a reliable attester and earn BLT.

## Installation & Deployment

### Create new host machine

We'll be using Ubuntu 18.04 LTS for the purpose of this guide. On Google Cloud, an example configuration might be 20GB of hard disk space, 1 vCPU, and 6 GB of RAM.

### System configuration

SSH into your instance. Use `apt-get update; apt-get install git docker.io` to install basic prerequisites. The install script for docker.io should automatically create a "docker" system group - use `usermod -aG docker myuser` to add `myuser` (or whichever user you want to run docker as) to the `docker` group.

Visit https://docs.docker.com/compose/install/ to follow current instructions to install docker-compose.

### Download code

Clone the https://github.com/hellobloom/attestation-kit repository to your chosen location on your server:

```
git clone https://github.com/hellobloom/attestation-kit /srv/attestation-kit
```

### Configuration

See [Bloom Docker](https://bloom.co/docs/attestation-kit/env) docs for most up-to-date info on editing the .env file.

### Networking

If you'd like your docker instance to run on the public internet, it's a good idea to run something like nginx or Apache httpd in front of the docker image, and limit public access to your application to ports 80 and 443 (and probably port 22 for SSH access), doing an HTTPS redirect on requests to port 80 in order to ensure data sent to and from your application is always encrypted. We recommend LetsEncrypt/certbot for free certificates that deploy very easily with miscellaneous server configurations. Example configuration for nginx and Ubuntu 18.04:

https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04

After that, nginx should be configured with a proxy_pass setup, e.g., `proxy_pass http://127.0.0.1:3000;` in the "location" block for your server configuration.

For dev environments with a database running on the host, PostgreSQL must be configured to accept connections from Docker. An example configuration not requiring authentication might look like this (for docker-assigned IP addresses in the 172.18.0.0/16 and 172.17.0.0/16 subnets, and a Docker host address of 172.17.0.1):

```
# postgresql.conf
listen_addresses = 'localhost,172.17.0.1'

# pg_hba.conf
host    bloom-whisper             all             172.17.0.0/16           trust
host    bloom-whisper             all             172.18.0.0/16           trust
```

Please read the official PostgreSQL documentation for each of these files for more information.

### Controlling your instance

To spin up your docker-compose instance. Navigate to the application directory (e.g. /srv/bloom-whisper), and then...

For basic dev instances (assuming ganache-cli and postgresql running externally):

```
./bin/dev-docker
```

For simple, production configurations without an external database:

```
docker-compose down
docker-compose build
docker-compose up -d
```

For configurations with an external database:

```
docker-compose -f docker-compose.nodb.yml down
docker-compose -f docker-compose.nodb.yml build
docker-compose -f docker-compose.nodb.yml up -d
```

For development environment configurations (with geth and postgresql running locally):

```
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

To spin down your instance, run `docker-compose down`, or `docker-compose -f docker-compose.nodb.yml`, or `docker-compose -f docker-compose.dev.yml` accordingly.

### Accessing your instance

`docker exec -it CONTAINER_NAME /bin/bash`

CONTAINER_NAME should look something like `attestation-kit_app_1`
