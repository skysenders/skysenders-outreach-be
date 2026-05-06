FROM node:22.16.0-alpine
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY ./ .
RUN npm install
EXPOSE 3000
RUN npm run build
CMD ["npm", "run", "server"]
