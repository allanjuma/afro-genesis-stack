
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static site files
COPY site/ /usr/share/nginx/html/

# Copy Afro logo
COPY site/images/afro-logo.png /usr/share/nginx/html/images/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
