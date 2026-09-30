use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlag {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub percentage: Option<u32>,
    #[serde(default)]
    pub environments: HashMap<String, bool>,
}

#[derive(Clone)]
pub struct FlagsLocalClient {
    base_url: String,
    environment: String,
    flags: Arc<RwLock<HashMap<String, FeatureFlag>>>,
}

impl FlagsLocalClient {
    pub fn new(base_url: &str, environment: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            environment: environment.to_string(),
            flags: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn fetch_flags(&self) -> Result<(), Box<dyn std::error::Error>> {
        let url = format!("{}/api/v1/flags", self.base_url);
        let resp = reqwest::blocking::get(&url)?;
        let list: Vec<FeatureFlag> = resp.json()?;

        let mut lock = self.flags.write().map_err(|_| "Failed to acquire lock")?;
        lock.clear();
        for flag in list {
            lock.insert(flag.id.clone(), flag);
        }
        Ok(())
    }

    pub fn is_enabled(&self, flag_id: &str, user_key: Option<&str>) -> bool {
        let lock = match self.flags.read() {
            Ok(guard) => guard,
            Err(_) => return false,
        };

        if let Some(flag) = lock.get(flag_id) {
            let is_env_enabled = flag.environments.get(&self.environment).copied().unwrap_or(flag.enabled);
            if !is_env_enabled {
                return false;
            }

            if let Some(pct) = flag.percentage {
                if pct == 0 {
                    return false;
                }
                if pct >= 100 {
                    return true;
                }
                let key = user_key.unwrap_or("anonymous");
                let mut hasher = Sha256::new();
                hasher.update(format!("{}:{}", flag_id, key).as_bytes());
                let result = hasher.finalize();
                let hash_val = u32::from_be_bytes([result[0], result[1], result[2], result[3]]);
                return (hash_val % 100) < pct;
            }
            return true;
        }
        false
    }
}
