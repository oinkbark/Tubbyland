FROM node:buster

WORKDIR /app
COPY /package.json /app/
RUN ["npm", "install", "--production", "--legacy-peer-deps"],  
COPY . /app

CMD ["npm", "run", "deploy"]
