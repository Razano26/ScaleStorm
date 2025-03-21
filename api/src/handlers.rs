use crate::utils::get_pod_info;
use axum::{
    Json,
    extract::{Path, State},
};
use futures::future::join_all;
use k8s_openapi::api::core::v1::Pod;
use kube::Client;
use kube::api::{Api, ListParams};
use log::error;
use serde_json::json;
use std::sync::Arc;

// Get namespace from environment variable or use default
fn get_namespace() -> String {
    std::env::var("KUBERNETES_NAMESPACE").unwrap_or_else(|_| "harbor".to_string())
}

pub async fn list_pods(State(client): State<Arc<Client>>) -> Json<serde_json::Value> {
    let namespace = get_namespace();
    let pods: Api<Pod> = Api::namespaced(client.as_ref().clone(), &namespace);
    let lp = ListParams::default();

    match pods.list(&lp).await {
        Ok(pod_list) => {
            let namespace = namespace.clone();
            // Create a list of futures
            let futures: Vec<_> = pod_list
                .items
                .iter()
                .map(|p| {
                    get_pod_info(
                        client.clone(),
                        namespace.clone(),
                        p.metadata.name.clone().unwrap_or_default(),
                    )
                })
                .collect();

            // Wait for all futures and collect results
            let results: Vec<_> = join_all(futures).await.into_iter().flatten().collect();

            Json(json!({ "pods": results }))
        }
        Err(e) => {
            error!("Failed to list pods: {}", e);
            Json(json!({ "error": "Failed to fetch pods" }))
        }
    }
}

pub async fn get_pod(
    State(client): State<Arc<Client>>,
    Path(name): Path<String>,
) -> Json<serde_json::Value> {
    let namespace = get_namespace();
    match get_pod_info(client, namespace, name).await {
        Some(info) => Json(info),
        None => Json(json!({ "error": "Pod not found" })),
    }
}

pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn fallback() -> Json<serde_json::Value> {
    Json(json!({ "error": "Not Found" }))
}
