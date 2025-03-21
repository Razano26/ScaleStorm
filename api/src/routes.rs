use crate::handlers::{fallback, get_pod, health_check, list_pods};
use axum::{Router, routing::get};
use kube::Client;
use std::sync::Arc;

pub fn create_router(client: Arc<Client>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/pods", get(list_pods))
        .route("/pods/{name}", get(get_pod))
        .with_state(client) // Ajout du client comme état partagé
        .fallback(fallback)
}
