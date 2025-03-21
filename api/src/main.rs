mod handlers;
mod routes;
mod utils;

use kube::Client;
use log::info;
use routes::create_router;
use std::{net::SocketAddr, sync::Arc};
use axum::serve;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    env_logger::init();

    // Create Kubernetes client
    let client = Client::try_default()
        .await
        .expect("Failed to create Kubernetes client");
    let shared_client = Arc::new(client);

    let app = create_router(shared_client);

    // Get port from environment variable or use default
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    // Listen on all interfaces
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("Server running on http://{}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    serve(listener, app).await.unwrap();
}
