use crate::utils::parse_resource;

use axum::{Json, extract::Path};
use serde_json::json;
use rand::Rng;
use kube::{Client, api::{Api, ListParams}};
use k8s_openapi::api::core::v1::Pod;

pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn random_number() -> Json<serde_json::Value> {
    let random_num = rand::thread_rng().gen_range(0..=100);
    Json(json!({ "random": random_num }))
}

pub async fn list_pods() -> Json<serde_json::Value> {
    let client = Client::try_default().await.expect("Failed to create Kubernetes client");
    let pods: Api<Pod> = Api::namespaced(client, "harbor");
    let lp = ListParams::default();
    let pod_list = pods.list(&lp).await.expect("Failed to list pods");

    let pod_info: Vec<_> = pod_list.items.iter().map(|p| {
        let name = p.metadata.name.clone().unwrap_or_default();

        let cpu_limits = p.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.limits.as_ref().and_then(|l| l.get("cpu"))))));
        let cpu_requests = p.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.requests.as_ref().and_then(|l| l.get("cpu"))))));

        let memory_limits = p.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.limits.as_ref().and_then(|l| l.get("memory"))))));
        let memory_requests = p.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.requests.as_ref().and_then(|l| l.get("memory"))))));

        json!({
            "name": name,
            "cpu": {
                "limite": cpu_limits,
                "request": cpu_requests
            },
            "memory": {
                "limite": memory_limits,
                "request": memory_requests
            }
        })
    }).collect();

    Json(json!({ "pods": pod_info }))
}

pub async fn get_pod(Path(name): Path<String>) -> Json<serde_json::Value> {
    let client = Client::try_default().await.expect("Failed to create Kubernetes client");
    let pods: Api<Pod> = Api::namespaced(client, "harbor");

    if let Ok(pod) = pods.get(&name).await {
        let cpu_limits = pod.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.limits.as_ref().and_then(|l| l.get("cpu"))))));
        let cpu_requests = pod.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.requests.as_ref().and_then(|l| l.get("cpu"))))));

        let memory_limits = pod.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.limits.as_ref().and_then(|l| l.get("memory"))))));
        let memory_requests = pod.spec.as_ref().and_then(|spec| spec.containers.iter().find_map(|c| parse_resource(c.resources.as_ref().and_then(|r| r.requests.as_ref().and_then(|l| l.get("memory"))))));

        return Json(json!({
            "name": name,
            "cpu": {
                "limite": cpu_limits,
                "request": cpu_requests
            },
            "memory": {
                "limite": memory_limits,
                "request": memory_requests
            }
        }));
    }
    Json(json!({ "error": "Pod not found" }))
}

pub async fn fallback() -> Json<serde_json::Value> {
    Json(json!({ "error": "Not Found" }))
}
