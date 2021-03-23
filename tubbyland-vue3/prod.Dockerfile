FROM node:buster
ARG SHORT_SHA

WORKDIR /app
COPY /package.json /app/
RUN ["npm", "install"]
COPY . /app

RUN sed -i "s/<--COMMIT SHA-->/$SHORT_SHA/" deploy/build-info.json

RUN ["npm", "run", "build"]
CMD ["npm", "run", "deploy"]
