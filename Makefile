# Makefile for Instagram Image Generator

.PHONY: help docker-build docker-build-fresh docker-start docker-stop docker-restart docker-update docker-test docker-test-all docker-test-health docker-test-image docker-test-carousel docker-test-markdown-carousel docker-test-reel docker-test-two-image-reel docker-test-three-part-reel docker-test-text-reel docker-test-watermark docker-test-setup docker-test-cleanup docker-logs docker-shell clean docker-rebuild

# Default target - show help
help:
	@echo "Instagram Image Generator - Docker Commands"
	@echo "============================================="
	@echo ""
	@echo "Available targets:"
	@echo "  make docker-build         - Build Docker image (uses cache)"
	@echo "  make docker-build-fresh   - Build Docker image (no cache, fresh build)"
	@echo "  make docker-start         - Start Docker container"
	@echo "  make docker-stop          - Stop Docker container"
	@echo "  make docker-update        - Quick update with cache (for local dev)"
	@echo "  make docker-restart       - Restart with fresh build (no cache)"
	@echo "  make docker-rebuild       - Clean, rebuild fresh, and start"
	@echo ""
	@echo "Docker Testing (NEW):"
	@echo "  make docker-test-setup              - Build and start test container"
	@echo "  make docker-test-all                - Test all endpoints"
	@echo "  make docker-test-health             - Test health endpoint"
	@echo "  make docker-test-image              - Test image generation"
	@echo "  make docker-test-carousel           - Test carousel generation"
	@echo "  make docker-test-markdown-carousel  - Test markdown carousel generation"
	@echo "  make docker-test-reel               - Test reel generation"
	@echo "  make docker-test-two-image-reel     - Test two-image reel generation"
	@echo "  make docker-test-three-part-reel    - Test three-part reel generation"
	@echo "  make docker-test-text-reel          - Test text reel generation"
	@echo "  make docker-test-watermark          - Test watermark generation"
	@echo "  make docker-test-cleanup            - Stop and cleanup test container"
	@echo "  make docker-test                    - Legacy: Run all tests (kept for compatibility)"
	@echo ""
	@echo "Other:"
	@echo "  make docker-logs          - Show Docker container logs"
	@echo "  make docker-shell         - Open shell inside running container"
	@echo "  make clean                - Clean up Docker images and containers"
	@echo ""
	@echo "Quick start:"
	@echo "  make docker-test-setup && make docker-test-all  # Test suite"
	@echo "  make docker-update                              # Quick local dev updates"
	@echo "  make docker-build && make docker-start          # Production"
	@echo "  make docker-rebuild                             # Clean rebuild"

# Docker configuration
DOCKER_IMAGE = instagram-generator
DOCKER_CONTAINER = instagram-generator-app
DOCKER_PORT = 8000

# Build Docker image (with cache for speed)
docker-build:
	@echo "🏗️  Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .
	@echo "✅ Docker image built successfully!"

# Build Docker image without cache (ensures fresh build)
docker-build-fresh:
	@echo "🏗️  Building Docker image (no cache)..."
	docker build --no-cache -t $(DOCKER_IMAGE) .
	@echo "✅ Docker image built successfully!"

# Start Docker container
docker-start:
	@echo "🚀 Starting Docker container..."
	@if [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		echo "⚠️  Container already running"; \
	elif [ "$$(docker ps -aq -f name=$(DOCKER_CONTAINER))" ]; then \
		echo "🔄 Starting existing container..."; \
		docker start $(DOCKER_CONTAINER); \
	else \
		echo "🆕 Creating and starting new container..."; \
		docker run -d \
			--name $(DOCKER_CONTAINER) \
			-p $(DOCKER_PORT):$(DOCKER_PORT) \
			$(DOCKER_IMAGE); \
	fi
	@echo "✅ Container started!"
	@echo "📍 Server running at http://localhost:$(DOCKER_PORT)"
	@echo ""
	@echo "Check health: curl http://localhost:$(DOCKER_PORT)/health"

# Stop Docker container
docker-stop:
	@echo "🛑 Stopping Docker container..."
	@if [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		docker stop $(DOCKER_CONTAINER); \
		echo "✅ Container stopped"; \
	else \
		echo "⚠️  Container not running"; \
	fi

# Quick update for local development (uses cache - much faster!)
docker-update: docker-stop clean-container docker-build docker-start

# Restart Docker container (rebuilds image to pick up code changes)
docker-restart: docker-stop clean-container docker-build-fresh docker-start

# Remove container only (keeps image)
clean-container:
	@echo "🗑️  Removing container..."
	@if [ "$$(docker ps -aq -f name=$(DOCKER_CONTAINER))" ]; then \
		docker rm $(DOCKER_CONTAINER); \
		echo "✅ Container removed"; \
	else \
		echo "⚠️  No container to remove"; \
	fi

# Run tests inside Docker container
docker-test:
	@echo "🧪 Running tests inside Docker container..."
	@echo ""
	@if ! [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		echo "❌ Error: Container not running"; \
		echo "   Run 'make docker-start' first"; \
		exit 1; \
	fi
	@echo "1️⃣  Testing health endpoint..."
	@curl -s http://localhost:$(DOCKER_PORT)/health | jq '.' || echo "❌ Health check failed"
	@echo ""
	@echo ""
	@echo "2️⃣  Testing image generation..."
	@curl -X POST http://localhost:$(DOCKER_PORT)/generate-image \
		-H "Content-Type: application/json" \
		-d @tests/fixtures/example_input.json \
		--output docker_test_output.jpg \
		-s -w "HTTP Status: %{http_code}\n"
	@if [ -f docker_test_output.jpg ]; then \
		SIZE=$$(ls -lh docker_test_output.jpg | awk '{print $$5}'); \
		echo "✅ Image generated successfully ($$SIZE)"; \
		echo "   Saved to: docker_test_output.jpg"; \
	else \
		echo "❌ Image generation failed"; \
	fi
	@echo ""
	@echo ""
	@echo "3️⃣  Testing carousel generation..."
	@curl -X POST http://localhost:$(DOCKER_PORT)/generate-carousel \
		-H "Content-Type: application/json" \
		-d @tests/fixtures/example_carousel_input.json \
		--output docker_carousel_test.zip \
		-s -w "HTTP Status: %{http_code}\n"
	@if [ -f docker_carousel_test.zip ]; then \
		SIZE=$$(ls -lh docker_carousel_test.zip | awk '{print $$5}'); \
		echo "✅ Carousel generated successfully ($$SIZE)"; \
		echo "   Saved to: docker_carousel_test.zip"; \
		echo ""; \
		echo "   Extracting..."; \
		unzip -o docker_carousel_test.zip -d output/docker_carousel_test/ > /dev/null 2>&1; \
		COUNT=$$(ls -1 output/docker_carousel_test/*.jpg 2>/dev/null | wc -l); \
		echo "   Extracted $$COUNT slides to output/docker_carousel_test/"; \
	else \
		echo "❌ Carousel generation failed"; \
	fi
	@echo ""
	@echo "✅ All tests completed!"

# Show Docker logs
docker-logs:
	@echo "📋 Showing Docker container logs..."
	@echo "   (Press Ctrl+C to stop following)"
	@echo ""
	@if [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		docker logs -f $(DOCKER_CONTAINER); \
	else \
		echo "⚠️  Container not running"; \
	fi

# Open shell inside container
docker-shell:
	@echo "🐚 Opening shell in Docker container..."
	@if [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		docker exec -it $(DOCKER_CONTAINER) /bin/bash; \
	else \
		echo "❌ Error: Container not running"; \
		echo "   Run 'make docker-start' first"; \
	fi

# Clean up Docker resources
clean:
	@echo "🧹 Cleaning up Docker resources..."
	@if [ "$$(docker ps -q -f name=$(DOCKER_CONTAINER))" ]; then \
		echo "   Stopping container..."; \
		docker stop $(DOCKER_CONTAINER); \
	fi
	@if [ "$$(docker ps -aq -f name=$(DOCKER_CONTAINER))" ]; then \
		echo "   Removing container..."; \
		docker rm $(DOCKER_CONTAINER); \
	fi
	@if [ "$$(docker images -q $(DOCKER_IMAGE))" ]; then \
		echo "   Removing image..."; \
		docker rmi $(DOCKER_IMAGE); \
	fi
	@echo "   Cleaning test files..."; \
	@rm -f docker_test_output.jpg docker_carousel_test.zip
	@echo "✅ Cleanup complete!"

# Quick rebuild (clean + fresh build + start)
docker-rebuild: clean docker-build-fresh docker-start
	@echo ""
	@echo "🎉 Rebuild complete!"

# ============================================
# New Docker Testing Suite
# ============================================

# Build and start test container
docker-test-setup:
	@echo "🐳 Setting up Docker test environment..."
	@./docker-test-build.sh

# Test all endpoints
docker-test-all:
	@echo "🧪 Running all endpoint tests..."
	@./docker-test-all.sh

# Test health endpoint
docker-test-health:
	@echo "🔍 Testing health endpoint..."
	@./docker-test-health.sh

# Test image generation
docker-test-image:
	@echo "🎨 Testing image generation..."
	@./docker-test-image.sh

# Test carousel generation
docker-test-carousel:
	@echo "📱 Testing carousel generation..."
	@./docker-test-carousel.sh

# Test markdown carousel generation
docker-test-markdown-carousel:
	@echo "📝 Testing markdown carousel generation..."
	@./docker-test-markdown-carousel.sh

# Test reel generation
docker-test-reel:
	@echo "🎬 Testing reel generation..."
	@./docker-test-reel.sh

# Test two-image reel generation
docker-test-two-image-reel:
	@echo "🎥 Testing two-image reel generation..."
	@./docker-test-two-image-reel.sh

# Test three-part reel generation
docker-test-three-part-reel:
	@echo "🎬 Testing three-part reel generation..."
	@./docker-test-three-part-reel.sh

# Test text reel generation
docker-test-text-reel:
	@echo "✍️  Testing text reel generation..."
	@./docker-test-text-reel.sh

# Test watermark generation
docker-test-watermark:
	@echo "🖼️  Testing watermark generation..."
	@./docker-test-watermark.sh

# Cleanup test container and files
docker-test-cleanup:
	@echo "🧹 Cleaning up test environment..."
	@./docker-test-cleanup.sh


