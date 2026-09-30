# flags-local

High-performance, lightweight Rust client SDK for [flags-local](https://github.com/authoritydmc/flags-local) feature flag management.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
flags-local = "1.0.0"
```

## Quick Start

```rust
use flags_local::FlagsLocalClient;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = FlagsLocalClient::new("http://localhost:4040", "production");
    client.fetch_flags()?;

    if client.is_enabled("new-checkout-flow", Some("usr_12345")) {
        println!("🚀 New checkout flow is enabled for this user!");
    } else {
        println!("Legacy flow active.");
    }

    Ok(())
}
```
