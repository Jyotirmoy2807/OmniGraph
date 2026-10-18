from datetime import datetime, timezone
from typing import Dict, Any
from app.config import settings
from app.models.api_schemas import WebhookDispatchResult

class WebhookService:
    """
    Executes and logs mock IAM/SRE dispatch webhooks upon verified policy compliance.
    """
    def dispatch_action(
        self,
        tenant_id: str,
        episode_id: str,
        actor_id: str,
        resource_id: str,
        action_name: str = "EXECUTE_AUTHORIZED_OPERATION"
    ) -> WebhookDispatchResult:
        now_iso = datetime.now(timezone.utc).isoformat()
        payload: Dict[str, Any] = {
            "event": "GOVERNANCE_VERIFIED_DISPATCH",
            "tenant_id": tenant_id,
            "episode_id": episode_id,
            "authorized_actor": actor_id,
            "target_resource": resource_id,
            "action": action_name,
            "compliance_status": "VERIFIED_FAIL_CLOSED_PASSED",
            "timestamp": now_iso
        }

        # Deterministic simulation of external IAM/dispatch webhook
        return WebhookDispatchResult(
            dispatched=True,
            target_url=settings.MOCK_WEBHOOK_URL,
            http_status=200,
            payload=payload,
            timestamp=now_iso
        )

webhook_service = WebhookService()
