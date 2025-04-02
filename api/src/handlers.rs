use crate::utils::get_pod_info;
use axum::{
    Json,
    extract::{Path, State},
};
use futures::future::join_all;
use k8s_openapi::api::core::v1::Pod;
use k8s_openapi::api::autoscaling::v1::HorizontalPodAutoscaler;
use k8s_openapi::api::apps::v1::Deployment;
use kube::Client;
use kube::api::{Api, ListParams};
use log::error;
use serde_json::json;
use std::sync::Arc;

async fn get_deployment_replicas(client: &Client, namespace: &str, name: &str) -> Option<i32> {
    let deployments: Api<Deployment> = Api::namespaced(client.clone(), namespace);
    match deployments.get(name).await {
        Ok(deployment) => deployment.spec.and_then(|spec| spec.replicas),
        Err(e) => {
            error!("Failed to get deployment {}/{}: {}", namespace, name, e);
            None
        }
    }
}

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
            let spec: k8s_openapi::api::autoscaling::v1::HorizontalPodAutoscalerSpec = hpa.spec.unwrap_or_default();
            let status = hpa.status.unwrap_or_default();

            let mut metrics = json!({});

            // Check CPU metrics from spec
            if let Some(cpu_target) = spec.target_cpu_utilization_percentage {
                metrics["cpu"] = json!({
                    "enabled": true,
                    "target": cpu_target
                });
            }

            Json(json!({
                "enabled": true,
                "manualReplicas": status.current_replicas,
                "minReplicas": spec.min_replicas,
                "maxReplicas": spec.max_replicas,
                "metrics": metrics
            }))
        }
        Err(_) => {
            // error!("Failed to get autoscale: {}", e);
            Json(json!({
                "enabled": false,
                "manualReplicas": 1
            }))
        }
    }
}
// update specific autoscale (ns: scalestorm, name: demo-app)
pub async fn update_autoscale(
    State(client): State<Arc<Client>>,
    Json(body): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    // Validate body structure matches Autoscale type
    let enabled = body.get("enabled").and_then(|v| v.as_bool());
    let manual_replicas = body.get("manualReplicas").and_then(|v| v.as_i64());

    if enabled.is_none() || manual_replicas.is_none() {
        return Json(json!({
            "error": "Invalid request body - missing required fields"
        }));
    }

    // If enabled is true, validate min/max replicas
    if enabled.unwrap() {
        let min_replicas = body.get("minReplicas").and_then(|v| v.as_i64());
        let max_replicas = body.get("maxReplicas").and_then(|v| v.as_i64());

        if min_replicas.is_none() || max_replicas.is_none() {
            return Json(json!({
                "error": "When enabled is true, minReplicas and maxReplicas are required"
            }));
        }
    }

    // Validate metrics if present
    if let Some(metrics) = body.get("metrics") {
        if let Some(cpu) = metrics.get("cpu") {
            let cpu_enabled = cpu.get("enabled").and_then(|v| v.as_bool());
            let cpu_target = cpu.get("target").and_then(|v| v.as_i64());

            if cpu_enabled.is_none() || cpu_target.is_none() {
                return Json(json!({
                    "error": "Invalid CPU metrics configuration"
                }));
            }
        }

        if let Some(memory) = metrics.get("memory") {
            let memory_enabled = memory.get("enabled").and_then(|v| v.as_bool());
            let memory_target = memory.get("target").and_then(|v| v.as_i64());

            if memory_enabled.is_none() || memory_target.is_none() {
                return Json(json!({
                    "error": "Invalid memory metrics configuration"
                }));
            }
        }
    }

    // get autoscale from scalestorm namespace, name: demo-app
    let autoscale_api: Api<HorizontalPodAutoscaler> = Api::namespaced(client.as_ref().clone(), "scalestorm");
    let autoscale = autoscale_api.get("demo-app").await;

    match autoscale {
        Ok(mut hpa) => {
            if enabled.unwrap() {
                // Update HPA spec
                let mut spec = hpa.spec.unwrap_or_default();
                spec.min_replicas = Some(body.get("minReplicas").and_then(|v| v.as_i64()).unwrap_or(1) as i32);
                spec.max_replicas = body.get("maxReplicas").and_then(|v| v.as_i64()).unwrap_or(10) as i32;

                // Update metrics if present
                if let Some(metrics) = body.get("metrics") {
                    if let Some(cpu) = metrics.get("cpu") {
                        if cpu.get("enabled").and_then(|v| v.as_bool()).unwrap_or(false) {
                            spec.target_cpu_utilization_percentage = cpu.get("target").and_then(|v| v.as_i64()).map(|v| v as i32);
                        }
                    }
                }

                hpa.spec = Some(spec);
            } else {
                // If disabled, set min and max replicas to manual_replicas
                let mut spec = hpa.spec.unwrap_or_default();
                spec.min_replicas = Some(manual_replicas.unwrap_or(1) as i32);
                spec.max_replicas = manual_replicas.unwrap_or(1) as i32;
                hpa.spec = Some(spec);
            }

            // Apply the changes
            match autoscale_api.replace("demo-app", &Default::default(), &hpa).await {
                Ok(_) => Json(json!({ "status": "ok" })),
                Err(e) => {
                    error!("Failed to update autoscale: {}", e);
                    Json(json!({ "error": "Failed to update autoscale" }))
                }
            }
        }
        Err(e) => {
            error!("Failed to get autoscale: {}", e);
            Json(json!({ "error": "Failed to get autoscale" }))
        }
    }
}
