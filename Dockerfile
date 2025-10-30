# Use official Deno image with ARM64 support
FROM denoland/deno:2.0.6

# Set working directory
WORKDIR /app

# Install system dependencies for canvas (skia) and video generation
# These are needed for the native canvas bindings and FFmpeg
RUN apt-get update && apt-get install -y \
    fontconfig \
    fonts-liberation \
    libfontconfig1 \
    zip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy assets directory (fonts and images)
COPY assets/ ./assets/

# Copy application files
COPY src/ ./src/
COPY deno.json ./

# Cache the dependencies (this layer will rebuild when source files change)
RUN deno cache --reload src/server.ts src/generators/image.ts src/generators/carousel.ts src/generators/reel.ts src/generators/twoImageReel.ts src/generators/threePartReel.ts src/generators/watermark.ts

# Expose the server port
EXPOSE 8000

# Set environment variables for better npm compatibility
ENV DENO_NO_PACKAGE_JSON=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD deno eval "fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))"

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-run", "--allow-ffi", "--allow-sys", "--allow-env", "src/server.ts"]

