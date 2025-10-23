FROM node:18

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./

RUN npm ci --ignore-scripts

RUN npm install -g ts-node typescript

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
