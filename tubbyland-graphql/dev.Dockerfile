FROM node:buster

WORKDIR /app
COPY /package.json /app/
RUN ["npm", "install", "--production", "--legacy-peer-deps"],  
COPY . /app

EXPOSE 8080

# Run container in dev mode
CMD ["tail", "-f", "/dev/null"]
