FROM node:12.20-alpine3.12

WORKDIR /opt/app-root
COPY package.json /opt/app-root/
RUN npm install

COPY . .

CMD [ "node", "--max-old-space-size=1024", "index.js" ]
