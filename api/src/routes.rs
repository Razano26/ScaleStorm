use crate::handlers::{fallback, get_pod, health_check, list_pods_all_namespaces, list_pods_namespace, get_autoscale};
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
        .route("/pods", get(list_pods_all_namespaces))
        .route("/pods/{namespace}", get(list_pods_namespace))
        .route("/pods/{namespace}/{name}", get(get_pod))
        .route("/autoscale", get(get_autoscale))
        .with_state(client)
        .fallback(fallback)
        .layer(cors)
}
