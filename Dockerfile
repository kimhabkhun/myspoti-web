# ==============================================================================
# Myspoti Web - Unified Multi-Stage Dockerfile (Frontend + Backend in 1 Image)
# Stage 1: Ultra-fast React + Lucide frontend build using Bun
# Stage 2: Cargo Chef Planner for Rust dependency layer caching
# Stage 3: High-performance Rust binary compilation
# Stage 4: Minimal, secure, statically-linked Alpine Linux runtime image (~30MB)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React.js + Lucide Web UI with Bun
# ------------------------------------------------------------------------------
FROM oven/bun:alpine AS frontend-builder
WORKDIR /app/frontend

# Cache dependencies
COPY frontend/package.json ./
RUN bun install

# Build static distribution into /app/web
COPY frontend/ ./
RUN bun run build

# ------------------------------------------------------------------------------
# Stage 2: Cargo Chef Planner for Rust dependency caching
# ------------------------------------------------------------------------------
FROM rust:alpine AS chef
RUN apk add --no-cache musl-dev pkgconfig openssl-dev perl make gcc g++
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ------------------------------------------------------------------------------
# Stage 3: Cache Dependencies & Build Rust Backend Binary
# ------------------------------------------------------------------------------
FROM chef AS backend-builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin myspoti-server

# ------------------------------------------------------------------------------
# Stage 4: Minimal Production Image (Alpine Linux with CA Certificates)
# ------------------------------------------------------------------------------
FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy Rust backend executable, Spotify GraphQL schema/ops, and built static frontend
COPY --from=backend-builder /app/target/release/myspoti-server /app/myspoti-server
COPY --from=backend-builder /app/config /app/config
COPY --from=frontend-builder /app/web /app/web

ENV RUST_LOG=info
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/healthz || exit 1

ENTRYPOINT ["/app/myspoti-server"]
