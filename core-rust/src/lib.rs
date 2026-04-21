use wasm_bindgen::prelude::*;

pub mod constants;
pub mod bacchant;

use crate::bacchant::BacchantCodec;

#[wasm_bindgen]
pub struct CryptagramCore {
    // State if needed
}

#[wasm_bindgen]
impl CryptagramCore {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        CryptagramCore {}
    }

    pub fn detect(&self, width: usize, height: usize, data: &[u8]) -> Option<String> {
        let (payload, _) = BacchantCodec::decode(width, height, data);
        if payload.is_some() {
            return Some("bacchant".to_string());
        }
        None
    }

    pub fn decode(&self, width: usize, height: usize, data: &[u8]) -> Result<String, JsValue> {
        let (payload, status) = BacchantCodec::decode(width, height, data);
        match payload {
            Some(p) => Ok(p),
            None => Err(JsValue::from_str(&status)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init() {
        let _core = CryptagramCore::new();
    }
}
