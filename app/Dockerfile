FROM ubuntu:16.04

# BASE 
RUN useradd -ms /bin/bash ubuntu
RUN apt update && apt-get install -y software-properties-common apt-utils curl apt-transport-https openssh-server git nmap
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -

RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    python-pip \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# SUPERVISOR
RUN pip install pip --upgrade
RUN pip install supervisor --upgrade
RUN sed -i "s#usr/bin#usr/local/bin#g" /lib/systemd/system/supervisor.service

# MAKE APP FOLDER
RUN mkdir -p /vol/app-logs/
RUN mkdir -p /app
RUN chown -R ubuntu /vol/app-logs /app

USER ubuntu
ADD . /app

USER root
RUN rm -f /app/build/api.js /app/build/worker.js /app/build/whisperWorker.js
RUN cp /app/supervisord.conf /etc/supervisord.conf
RUN chown -R ubuntu /vol/app-logs /app

# INITIALIZE APP
USER ubuntu
WORKDIR /app
RUN /app/bin/docker-cleanup-env
RUN npm install --verbose
RUN /app/bin/build

# EXPOSE PORT
EXPOSE 13000

# CMD ["/app/bin/start-supervisor"]
