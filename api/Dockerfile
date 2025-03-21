# Use a specific Rust version that's compatible with Debian bullseye
FROM rust:1-bullseye as builder

# Add metadata
LABEL maintainer="ScaleStorm Team"
LABEL description="ScaleStorm API Service"
LABEL version="1.0"

WORKDIR /usr/src/myapp
COPY . .

RUN cargo build --release

# Use Debian bullseye for runtime (newer than buster)
FROM debian:bullseye-slim

# Add metadata
LABEL maintainer="ScaleStorm Team"
LABEL description="ScaleStorm API Service"
LABEL version="1.0"

# Install necessary runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 scalestorm

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/myapp/target/release/scalestorm-api /app/scalestorm-api

# Set proper permissions
RUN chown -R scalestorm:scalestorm /app

# Switch to non-root user
USER scalestorm

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV RUST_LOG=info
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Run the binary
CMD ["./scalestorm-api"]
