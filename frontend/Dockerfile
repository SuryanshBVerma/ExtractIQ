# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the React application for production
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the built React application files from the build stage to Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80, which Nginx will listen on
EXPOSE 80

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]