# Stage 1: Build the application
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the application
FROM node:18

WORKDIR /app

COPY --from=build /app .

RUN npm install --only=production

CMD ["npm", "run", "start:prod"]
