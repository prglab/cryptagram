use wasm_bindgen::prelude::*;

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

    pub fn detect(&self, _image_data: &[u8]) -> Option<String> {
        // TODO: Implement Bacchant/Aesthete detection
        None
    }

    pub fn decode(&self, _image_data: &[u8]) -> Result<String, JsValue> {
        // TODO: Implement decode
        Err(JsValue::from_str("Not implemented"))
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
