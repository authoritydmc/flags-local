import hashlib
from typing import Any, Dict, List, Optional
import httpx


class FlagRule:
    def __init__(self, attribute: str, operator: str, value: Any):
        self.attribute = attribute
        self.operator = operator
        self.value = value

    def evaluate(self, context: Dict[str, Any]) -> bool:
        val = context.get("attributes", {}).get(self.attribute, context.get("key") if self.attribute == "key" else None)
        if val is None:
            return False

        if self.operator == "equals":
            return str(val) == str(self.value)
        elif self.operator == "contains":
            return str(self.value) in str(val)
        elif self.operator == "in":
            return str(val) in [str(x) for x in self.value] if isinstance(self.value, list) else False
        elif self.operator == "greaterThan":
            return float(val) > float(self.value)
        elif self.operator == "lessThan":
            return float(val) < float(self.value)
        return False


class FeatureFlag:
    def __init__(
        self,
        id: str,
        name: str,
        enabled: bool,
        environments: Optional[Dict[str, bool]] = None,
        percentage: Optional[int] = None,
        rules: Optional[List[Dict[str, Any]]] = None,
        value: Any = None,
    ):
        self.id = id
        self.name = name
        self.enabled = enabled
        self.environments = environments or {}
        self.percentage = percentage
        self.rules = [FlagRule(**r) for r in rules] if rules else []
        self.value = value


class FlagsLocalClient:
    def __init__(
        self,
        base_url: str = "http://localhost:4040",
        environment: str = "development",
        default_flags: Optional[Dict[str, bool]] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.environment = environment
        self.default_flags = default_flags or {}
        self.flags: Dict[str, FeatureFlag] = {}

    def fetch_flags(self) -> None:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.base_url}/api/v1/flags")
                if res.status_code == 200:
                    data = res.json()
                    self.flags = {item["id"]: FeatureFlag(**item) for item in data}
        except Exception:
            pass

    async def afetch_flags(self) -> None:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/v1/flags")
                if res.status_code == 200:
                    data = res.json()
                    self.flags = {item["id"]: FeatureFlag(**item) for item in data}
        except Exception:
            pass

    def is_enabled(
        self,
        flag_id: str,
        user_key: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
        fallback: Optional[bool] = None,
    ) -> bool:
        if flag_id not in self.flags:
            if fallback is not None:
                return fallback
            return self.default_flags.get(flag_id, False)

        flag = self.flags[flag_id]
        env_enabled = flag.environments.get(self.environment, flag.enabled)
        if not env_enabled:
            return False

        context = {"key": user_key, "attributes": attributes or {}}

        # Rules evaluation
        if flag.rules:
            for rule in flag.rules:
                if rule.evaluate(context):
                    return True
            if flag.percentage is None:
                return False

        # Percentage rollout
        if flag.percentage is not None:
            key = user_key or "anonymous"
            hash_int = int(hashlib.sha256(f"{flag.id}:{key}".encode("utf-8")).hexdigest()[:8], 16) % 100
            return hash_int < flag.percentage

        return True
