# Use Node.js Alpine as base image
FROM node:alpine

WORKDIR /usr/app

# Copy application files
COPY ./ /usr/app

# Install dependencies
RUN npm install

# Set environment variable
ENV NODE_ENV=development

# Run the application
CMD ["node", "index.js"]