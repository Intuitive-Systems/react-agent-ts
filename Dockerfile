# node typescript yarn dockerfile
FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN yarn
COPY ./src /usr/src/app/src
COPY ./tsconfig.json /usr/src/app/
EXPOSE 3000
CMD ["yarn", "run", "start"]