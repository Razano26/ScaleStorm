use crate::handlers::{fallback, get_pod, health_check, list_pods};
use axum::{Router, routing::get};
use kube::Client;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

pub fn create_router(client: Arc<Client>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health_check))
        .route("/pods", get(list_pods))
        .route("/pods/{name}", get(get_pod))
        .with_state(client) // Ajout du client comme état partagé
        .fallback(fallback)
        .layer(cors)
}
