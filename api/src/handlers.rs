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
    let manual_replicas = get_deployment_replicas(client.as_ref(), "scalestorm", "demo-app").await;

    match autoscale.get("demo-app").await {
        Ok(hpa) => {
            let spec: k8s_openapi::api::autoscaling::v1::HorizontalPodAutoscalerSpec = hpa.spec.unwrap_or_default();

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
                "manualReplicas": manual_replicas.unwrap_or(1),
                "minReplicas": spec.min_replicas,
                "maxReplicas": spec.max_replicas,
                "metrics": metrics
            }))
        }
        Err(_) => {
            Json(json!({
                "enabled": false,
                "manualReplicas": manual_replicas.unwrap_or(1)
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

    // Update deployment replicas
    let deployments: Api<Deployment> = Api::namespaced(client.as_ref().clone(), "scalestorm");
    if let Ok(mut deployment) = deployments.get("demo-app").await {
        if let Some(spec) = deployment.spec.as_mut() {
            spec.replicas = Some(manual_replicas.unwrap() as i32);
            if let Err(e) = deployments.replace("demo-app", &Default::default(), &deployment).await {
                error!("Failed to update deployment replicas: {}", e);
                return Json(json!({ "error": "Failed to update deployment replicas" }));
            }
        }
    }

    let autoscale_api: Api<HorizontalPodAutoscaler> = Api::namespaced(client.as_ref().clone(), "scalestorm");
    let autoscale_exists = autoscale_api.get("demo-app").await.is_ok();
    let autoscale = autoscale_api.get("demo-app").await;

    if enabled.unwrap() {
        // Create or update HPA
        let mut hpa = match autoscale {
            Ok(hpa) => hpa,
            Err(_) => {
                // Create new HPA if it doesn't exist
                HorizontalPodAutoscaler {
                    metadata: k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta {
                        name: Some("demo-app".to_string()),
                        namespace: Some("scalestorm".to_string()),
                        ..Default::default()
                    },
                    spec: Some(k8s_openapi::api::autoscaling::v1::HorizontalPodAutoscalerSpec {
                        scale_target_ref: k8s_openapi::api::autoscaling::v1::CrossVersionObjectReference {
                            kind: "Deployment".to_string(),
                            name: "demo-app".to_string(),
                            api_version: Some("apps/v1".to_string()),
                        },
                        min_replicas: Some(body.get("minReplicas").and_then(|v| v.as_i64()).unwrap_or(1) as i32),
                        max_replicas: body.get("maxReplicas").and_then(|v| v.as_i64()).unwrap_or(10) as i32,
                        target_cpu_utilization_percentage: body.get("metrics")
                            .and_then(|m| m.get("cpu"))
                            .and_then(|c| c.get("enabled"))
                            .and_then(|e| e.as_bool())
                            .filter(|&e| e)
                            .and_then(|_| body.get("metrics")
                                .and_then(|m| m.get("cpu"))
                                .and_then(|c| c.get("target"))
                                .and_then(|t| t.as_i64())
                                .map(|t| t as i32)),
                        ..Default::default()
                    }),
                    ..Default::default()
                }
            }
        };

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
        // Apply the changes based on whether HPA exists
        if autoscale_exists {
            // If HPA exists, use replace
            match autoscale_api.replace("demo-app", &Default::default(), &hpa).await {
                Ok(_) => Json(json!({ "status": "ok" })),
                Err(e) => {
                    error!("Failed to update autoscale: {}", e);
                    Json(json!({ "error": "Failed to update autoscale" }))
                }
            }
        } else {
            // If HPA doesn't exist, use create
            match autoscale_api.create(&Default::default(), &hpa).await {
                Ok(_) => Json(json!({ "status": "ok" })),
                Err(e) => {
                    error!("Failed to create autoscale: {}", e);
                    Json(json!({ "error": "Failed to create autoscale" }))
                }
            }
        }
    } else {
        // Delete HPA if it exists
        match autoscale {
            Ok(_) => {
                match autoscale_api.delete("demo-app", &Default::default()).await {
                    Ok(_) => Json(json!({ "status": "ok" })),
                    Err(e) => {
                        error!("Failed to delete autoscale: {}", e);
                        Json(json!({ "error": "Failed to delete autoscale" }))
                    }
                }
            }
            Err(_) => Json(json!({ "status": "ok" })), // HPA doesn't exist, which is fine
        }
    }
}
