# Use official Deno image (explicitly for linux/amd64)
FROM --platform=linux/amd64 denoland/deno:1.40.0

# Set working directory
WORKDIR /app

# Install system dependencies for canvas (skia)
# These are needed for the native canvas bindings
RUN apt-get update && apt-get install -y \
    fontconfig \
    fonts-liberation \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# Copy font files
COPY Merriweather-*.ttf ./

# Copy background image
COPY background.jpeg ./

# Copy application files
COPY generate_image.ts ./
COPY server.ts ./
COPY deno.json ./

# Cache the dependencies
RUN deno cache server.ts generate_image.ts

# Expose the server port
EXPOSE 8000

# Set environment variables for better npm compatibility
ENV DENO_NO_PACKAGE_JSON=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD deno eval "fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))"

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-run", "--allow-ffi", "--allow-sys", "--allow-env", "server.ts"]

