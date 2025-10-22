# Makefile for Instagram Image Generator

.PHONY: help docker-build docker-build-fresh docker-start docker-stop docker-restart docker-test docker-logs docker-shell clean docker-rebuild

# Default target - show help
help:
	@echo "Instagram Image Generator - Docker Commands"
	@echo "============================================="
	@echo ""
	@echo "Available targets:"
	@echo "  make docker-build       - Build Docker image (uses cache)"
	@echo "  make docker-build-fresh - Build Docker image (no cache, fresh build)"
	@echo "  make docker-start       - Start Docker container"
	@echo "  make docker-stop        - Stop Docker container"
	@echo "  make docker-restart     - Restart with fresh build (no cache)"
	@echo "  make docker-rebuild     - Clean, rebuild fresh, and start"
	@echo "  make docker-test        - Run tests inside Docker container"
	@echo "  make docker-logs        - Show Docker container logs"
	@echo "  make docker-shell       - Open shell inside running container"
	@echo "  make clean              - Clean up Docker images and containers"
	@echo ""
	@echo "Quick start:"
	@echo "  make docker-build && make docker-start  # Fast (uses cache)"
	@echo "  make docker-rebuild                      # Clean rebuild (no cache)"
	@echo "  make docker-test                         # Test the container"

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

# Restart Docker container (rebuilds image to pick up code changes)
docker-restart: docker-stop docker-build-fresh docker-start

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


