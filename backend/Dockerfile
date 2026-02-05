FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]