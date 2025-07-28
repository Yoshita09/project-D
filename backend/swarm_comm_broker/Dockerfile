FROM node:18-slim
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 5400 5401
CMD ["node", "broker.js"] 