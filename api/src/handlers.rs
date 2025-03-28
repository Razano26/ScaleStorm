use crate::utils::get_pod_info;
use axum::{
    Json,
    extract::{Path, State},
};
use futures::future::join_all;
use k8s_openapi::api::core::v1::Pod;
use k8s_openapi::api::autoscaling::v1::HorizontalPodAutoscaler;
use kube::Client;
use kube::api::{Api, ListParams};
use log::error;
use serde_json::json;
use std::sync::Arc;

pub async fn list_pods_all_namespaces(State(client): State<Arc<Client>>) -> Json<serde_json::Value> {
    let pods: Api<Pod> = Api::all(client.as_ref().clone());
    let lp = ListParams::default();

    match pods.list(&lp).await {
        Ok(pod_list) => {
            // Create a list of futures
            let futures: Vec<_> = pod_list
                .items
                .iter()
                .map(|p| {
                    let namespace = p.metadata.namespace.clone().unwrap_or_default();
                    get_pod_info(
                        client.clone(),
                        namespace,
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

pub async fn list_pods_namespace(
    State(client): State<Arc<Client>>,
    Path(namespace): Path<String>,
) -> Json<serde_json::Value> {
    let pods: Api<Pod> = Api::namespaced(client.as_ref().clone(), &namespace);
    let lp = ListParams::default();

    match pods.list(&lp).await {
        Ok(pod_list) => {
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
            error!("Failed to list pods in namespace {}: {}", namespace, e);
            Json(json!({ "error": "Failed to fetch pods" }))
        }
    }
}

pub async fn get_pod(
    State(client): State<Arc<Client>>,
    Path((namespace, name)): Path<(String, String)>,
) -> Json<serde_json::Value> {
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

// get specific autoscale (ns: scalestorm, name: demo-app)
pub async fn get_autoscale(
    State(client): State<Arc<Client>>,
) -> Json<serde_json::Value> {
    let autoscale: Api<HorizontalPodAutoscaler> = Api::namespaced(client.as_ref().clone(), "scalestorm");

    match autoscale.get("demo-app").await {
        Ok(hpa) => {
            let spec = hpa.spec.unwrap_or_default();
            let status = hpa.status.unwrap_or_default();

            // Parse metrics from annotations
            let metrics_annotation = hpa.metadata.annotations
                .and_then(|ann| ann.get("autoscaling.alpha.kubernetes.io/metrics").map(|s| s.to_string()))
                .and_then(|m| serde_json::from_str::<serde_json::Value>(&m).ok())
                .unwrap_or(json!([]));

            let cpu_target = metrics_annotation.as_array()
                .and_then(|arr| arr.iter().find(|m| m["resource"]["name"] == "cpu"))
                .and_then(|m| m["resource"]["target"]["averageUtilization"].as_i64())
                .unwrap_or(80) as i32;

            let memory_target = metrics_annotation.as_array()
                .and_then(|arr| arr.iter().find(|m| m["resource"]["name"] == "memory"))
                .and_then(|m| m["resource"]["target"]["averageUtilization"].as_i64())
                .unwrap_or(80) as i32;

            Json(json!({
                "enabled": true,
                "manualReplicas": status.current_replicas,
                "minReplicas": spec.min_replicas,
                "maxReplicas": spec.max_replicas,
                "cpu": {
                    "enabled": true,
                    "target": cpu_target
                },
                "memory": {
                    "enabled": true,
                    "target": memory_target
                }
            }))
        }
        Err(e) => {
            error!("Failed to get autoscale: {}", e);
            Json(json!({
                "enabled": false,
                "manualReplicas": 1,
                "minReplicas": 1,
                "maxReplicas": 10,
                "cpu": {
                    "enabled": false,
                    "target": 80
                },
                "memory": {
                    "enabled": false,
                    "target": 80
                }
            }))
        }
    }
}
