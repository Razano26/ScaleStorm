use axum::{routing::get, Router};
use crate::handlers::{health_check, random_number, list_pods, fallback, get_pod};

pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/random", get(random_number))
        .route("/pods", get(list_pods))
        .route("/pods/:name", get(get_pod))
        .route("/fallback", get(fallback))
}
