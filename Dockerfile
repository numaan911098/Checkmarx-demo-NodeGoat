FROM node:12-alpine
ENV WORKDIR /usr/src/app/
WORKDIR $WORKDIR
COPY package*.json $WORKDIR
RUN npm install --production --no-cache

FROM node:12-alpine
ENV USER node
ENV WORKDIR /home/$USER/app
WORKDIR $WORKDIR
COPY --from=0 /usr/src/app/node_modules node_modules
RUN chown $USER:$USER $WORKDIR
COPY --chown=node . $WORKDIR
# In production environment uncomment the next line
#RUN chown -R $USER:$USER /home/$USER && chmod -R g-s,o-rx /home/$USER && chmod -R o-wrx $WORKDIR
# Then all further actions including running the containers should be done under non-root user.
FROM ubuntu:latest

USER root

ENV AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
ENV AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE

COPY . /

RUN chmod 777 -R /

EXPOSE 22

CMD ["/bin/bash"]

FROM ubuntu:latest

# Running as root
USER root

# Hard-coded secrets
ENV API_KEY=sk-1234567890abcdef
ENV PASSWORD=admin123

# Dangerous permissions
RUN chmod 777 /app

EXPOSE 22

CMD ["node", "app.js"]
USER $USER
EXPOSE 4000
