use k8s_openapi::api::core::v1::Pod;
use k8s_openapi::apimachinery::pkg::api::resource::Quantity;
use kube::Client;
use kube::api::{Api, DynamicObject};
use kube::discovery::ApiResource;
use log::error;
use regex::Regex;
use serde_json::Value;
use serde_json::json;
use std::sync::Arc;

pub fn parse_resource(quantity: &Quantity) -> Option<serde_json::Value> {
    let value_str = quantity.0.as_str();
    let re = Regex::new(r"(\d+)([a-zA-Z]*)").ok()?;
    re.captures(value_str).and_then(|caps| {
        let value = caps.get(1)?.as_str().parse::<i64>().ok()?;
        let unit = caps.get(2).map_or("", |m| m.as_str());
        Some(json!({ "value": value, "unit": unit }))
    })
}

async fn get_pod_metrics(client: &Client, namespace: &str, name: &str) -> Option<serde_json::Value> {
    let api_resource = ApiResource::from_gvk(&kube::core::GroupVersionKind {
        group: "metrics.k8s.io".to_string(),
        version: "v1beta1".to_string(),
        kind: "PodMetrics".to_string(),
    });

    let metrics_api: Api<DynamicObject> = Api::namespaced_with(client.clone(), namespace, &api_resource);

    match metrics_api.get(name).await {
        Ok(metrics) => {
            if let Some(containers) = metrics.data.get("containers").and_then(|c| c.as_array()) {
                // Get the first container's metrics (assuming single container for simplicity)
                if let Some(container) = containers.first() {
                    if let Some(usage) = container.get("usage") {
                        let cpu = usage.get("cpu")
                            .and_then(|v| v.as_str())
                            .map(|s| Quantity(s.to_string()))
                            .and_then(|q| parse_resource(&q));

                        let memory = usage.get("memory")
                            .and_then(|v| v.as_str())
                            .map(|s| Quantity(s.to_string()))
                            .and_then(|q| parse_resource(&q));

                        Some(json!({
                            "cpu": cpu,
                            "memory": memory
                        }))
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            }
        }
        Err(e) => {
            error!("Failed to get metrics for pod {}: {}", name, e);
            None
        }
    }
}

pub async fn get_pod_info(
    client: Arc<Client>,
    namespace: String,
    name: String,
) -> Option<serde_json::Value> {
    let pods: Api<Pod> = Api::namespaced(client.as_ref().clone(), &namespace);

    match pods.get(&name).await {
        Ok(pod) => {
            // Get current usage metrics
            let usage = get_pod_metrics(client.as_ref(), &namespace, &name).await;

            let cpu_limit = parse_cpu(&pod, true);
            let cpu_request = parse_cpu(&pod, false);
            let memory_limit = parse_memory(&pod, true);
            let memory_request = parse_memory(&pod, false);

            Some(json!({
                "name": name,
                "cpu": {
                    "limit": cpu_limit,
                    "request": cpu_request,
                    "usage": usage.as_ref().and_then(|u| u.get("cpu"))
                },
                "memory": {
                    "limit": memory_limit,
                    "request": memory_request,
                    "usage": usage.as_ref().and_then(|u| u.get("memory"))
                }
            }))
        }
        Err(e) => {
            error!("Failed to get pod {}: {}", name, e);
            None
        }
    }
}

/// Récupère la quantité de CPU demandée ou allouée
pub fn parse_cpu(pod: &Pod, is_limit: bool) -> Option<Value> {
    pod.spec.as_ref().and_then(|spec| {
        spec.containers.iter().find_map(|c| {
            let resources = c.resources.as_ref()?;
            let cpu = if is_limit {
                &resources.limits
            } else {
                &resources.requests
            };
            cpu.as_ref()?.get("cpu").and_then(|q| parse_resource(q))
        })
    })
}

/// Récupère la quantité de mémoire demandée ou allouée
pub fn parse_memory(pod: &Pod, is_limit: bool) -> Option<Value> {
    pod.spec.as_ref().and_then(|spec| {
        spec.containers.iter().find_map(|c| {
            let resources = c.resources.as_ref()?;
            let mem = if is_limit {
                &resources.limits
            } else {
                &resources.requests
            };
            mem.as_ref()?.get("memory").and_then(parse_resource)
        })
    })
}

