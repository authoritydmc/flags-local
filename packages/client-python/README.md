# flags-local Python SDK

Fast, lightweight Python client for [flags-local](https://github.com/authoritydmc/flags-local).

## Installation

```bash
pip install flags-local
```

## Quick Start

```python
from flags_local import FlagsLocalClient

client = FlagsLocalClient(base_url="http://localhost:4040", environment="production")
client.fetch_flags()

if client.is_enabled("new-checkout-flow", user_key="usr_123"):
    print("New checkout enabled!")
```
