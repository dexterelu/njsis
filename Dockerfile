FROM node:slim

# Set up container path
ENV NJSIS_PATH /usr/src/njsis
RUN mkdir -p $NJSIS_PATH
WORKDIR $NJSIS_PATH

# Install app dependencies
COPY package.json $NJSIS_PATH/
RUN cd $NJSIS_PATH/ \
	&& npm install \
	&& node --version \
	&& npm cache clean

VOLUME $NJSIS_PATH

# Bundle app source
COPY . $NJSIS_PATH

EXPOSE 3000
CMD [ "npm", "start" ]