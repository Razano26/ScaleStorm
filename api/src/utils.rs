use regex::Regex;
use serde_json::json;
use k8s_openapi::apimachinery::pkg::api::resource::Quantity;

pub fn parse_resource(resource: Option<&Quantity>) -> Option<serde_json::Value> {
    resource.and_then(|quantity| {
        let value_str = quantity.0.as_str();
        let re = Regex::new(r"(\d+)([a-zA-Z]*)").unwrap();
        if let Some(caps) = re.captures(value_str) {
            let value = caps.get(1).map_or(0, |m| m.as_str().parse::<i64>().unwrap_or(0));
            let unit = caps.get(2).map_or("", |m| m.as_str());
            Some(json!({ "value": value, "unit": unit }))
        } else {
            None
        }
    })
}
