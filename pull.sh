#!/usr/bin/env bash

DOCKER_CONF=docker-compose.yml

git pull
docker-compose -f $DOCKER_CONF build
docker-compose -f $DOCKER_CONF down
docker-compose -f $DOCKER_CONF up -d
