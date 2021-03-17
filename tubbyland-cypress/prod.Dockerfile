FROM cypress/base:14.16.0

USER root

# Chrome dependencies
RUN apt-get update
RUN apt-get install -y fonts-liberation libappindicator3-1 xdg-utils

# https://chromium.cypress.io/
ENV CHROME_VERSION 89.0.4389.72
RUN wget -O /usr/src/google-chrome-stable_current_amd64.deb "http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb" && \
  dpkg -i /usr/src/google-chrome-stable_current_amd64.deb ; \
  apt-get install -f -y && \
  rm -f /usr/src/google-chrome-stable_current_amd64.deb
RUN google-chrome --version


WORKDIR /app
COPY /package.json /app/
RUN ["npm", "install"],
COPY . /app

CMD ["npm", "run", "test"]
