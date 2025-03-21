FROM rust:1.84-slim-bullseye AS build

# create a new empty shell project
RUN USER=root cargo new --bin scalestorm-api
WORKDIR /scalestorm-api

# copy over your manifests
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

# this build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# copy your source tree
COPY ./src ./src

# build for release
RUN cargo build --release

# our final base
FROM alpine:latest

# copy the build artifact from the build stage
COPY --from=build /scalestorm-api/target/release/scalestorm-api .

# set the startup command to run your binary
CMD ["./scalestorm-api"]
