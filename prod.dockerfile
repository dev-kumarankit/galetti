FROM node:16
WORKDIR /
COPY package*.json ./
RUN npm install
COPY . ./
# RUN npm run build
EXPOSE 443
CMD ["npm", "run", "start:prod"]
