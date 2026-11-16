import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import HTTPException, status


class SlidingWindowRateLimiter:
    """
    Sliding window in-memory rate limiter per agent.
    Maintains a rolling window of timestamps to enforce requests-per-minute limits.
    """
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.agent_requests: Dict[str, list[float]] = defaultdict(list)

    def check_rate_limit(self, agent_id: str) -> Tuple[bool, int]:
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean older requests outside the window
        timestamps = self.agent_requests[agent_id]
        valid_timestamps = [t for t in timestamps if t > window_start]
        self.agent_requests[agent_id] = valid_timestamps
        
        if len(valid_timestamps) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - valid_timestamps[0]))
            return False, max(1, retry_after)
            
        valid_timestamps.append(now)
        return True, 0


# Default rate limiters: 30 posts per min, 120 reads per min
post_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=60)
api_rate_limiter = SlidingWindowRateLimiter(max_requests=120, window_seconds=60)


def enforce_post_rate_limit(agent_id: str):
    allowed, retry_after = post_rate_limiter.check_rate_limit(agent_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for agent {agent_id}. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

