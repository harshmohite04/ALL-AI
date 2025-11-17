import os
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProviderType(Enum):
    OPENAI = "openai"
    GOOGLE = "google"
    GROQ = "groq"
    ANTHROPIC = "anthropic"
    DEEPSEEK = "deepseek"
    PERPLEXITY = "perplexity"

@dataclass
class RateLimitInfo:
    """Rate limit information for each provider"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    tokens_per_minute: Optional[int] = None
    tokens_per_day: Optional[int] = None

@dataclass
class KeyUsage:
    """Track usage for a specific API key"""
    key_id: str
    requests_count: List[float] = field(default_factory=list)  # timestamps
    tokens_used: List[tuple] = field(default_factory=list)  # (timestamp, token_count)
    last_error_time: Optional[float] = None
    consecutive_errors: int = 0
    is_blocked: bool = False
    block_until: Optional[float] = None
    
    def add_request(self, tokens: int = 0):
        """Add a request to usage tracking"""
        current_time = time.time()
        self.requests_count.append(current_time)
        if tokens > 0:
            self.tokens_used.append((current_time, tokens))
        
        # Clean old entries (keep last 24 hours)
        cutoff_time = current_time - 86400  # 24 hours
        self.requests_count = [t for t in self.requests_count if t > cutoff_time]
        self.tokens_used = [(t, tokens) for t, tokens in self.tokens_used if t > cutoff_time]
    
    def get_requests_in_window(self, window_seconds: int) -> int:
        """Get number of requests in the specified time window"""
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        return len([t for t in self.requests_count if t > cutoff_time])
    
    def get_tokens_in_window(self, window_seconds: int) -> int:
        """Get number of tokens used in the specified time window"""
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        return sum(tokens for t, tokens in self.tokens_used if t > cutoff_time)
    
    def is_rate_limited(self, rate_limits: RateLimitInfo) -> bool:
        """Check if this key is currently rate limited"""
        if self.is_blocked and self.block_until and time.time() < self.block_until:
            return True
            
        # Check request limits
        if self.get_requests_in_window(60) >= rate_limits.requests_per_minute:
            return True
        if self.get_requests_in_window(3600) >= rate_limits.requests_per_hour:
            return True
        if self.get_requests_in_window(86400) >= rate_limits.requests_per_day:
            return True
            
        # Check token limits if applicable
        if rate_limits.tokens_per_minute and self.get_tokens_in_window(60) >= rate_limits.tokens_per_minute:
            return True
        if rate_limits.tokens_per_day and self.get_tokens_in_window(86400) >= rate_limits.tokens_per_day:
            return True
            
        return False
    
    def record_error(self, block_duration: int = 300):  # 5 minutes default
        """Record an error and potentially block the key"""
        self.last_error_time = time.time()
        self.consecutive_errors += 1
        
        # Block key after 3 consecutive errors
        if self.consecutive_errors >= 3:
            self.is_blocked = True
            self.block_until = time.time() + block_duration
            logger.warning(f"Key {self.key_id} blocked for {block_duration}s due to consecutive errors")
    
    def record_success(self):
        """Record a successful request"""
        self.consecutive_errors = 0
        self.is_blocked = False
        self.block_until = None

class APIKeyManager:
    """Manages multiple API keys with automatic rotation and rate limiting"""
    
    def __init__(self):
        self.provider_keys: Dict[ProviderType, List[str]] = {}
        self.key_usage: Dict[str, KeyUsage] = {}
        self.rate_limits = self._get_rate_limits()
        self.current_key_index: Dict[ProviderType, int] = {}
        
        # Load API keys from environment
        self._load_api_keys()
    
    def _get_rate_limits(self) -> Dict[ProviderType, RateLimitInfo]:
        """Define rate limits for each provider"""
        return {
            ProviderType.OPENAI: RateLimitInfo(
                requests_per_minute=3500,
                requests_per_hour=10000,
                requests_per_day=200000,
                tokens_per_minute=90000,
                tokens_per_day=2000000
            ),
            ProviderType.GOOGLE: RateLimitInfo(
                requests_per_minute=60,
                requests_per_hour=1000,
                requests_per_day=50000
            ),
            ProviderType.GROQ: RateLimitInfo(
                requests_per_minute=30,
                requests_per_hour=14400,
                requests_per_day=14400
            ),
            ProviderType.ANTHROPIC: RateLimitInfo(
                requests_per_minute=50,
                requests_per_hour=1000,
                requests_per_day=50000,
                tokens_per_minute=40000,
                tokens_per_day=1000000
            ),
            ProviderType.DEEPSEEK: RateLimitInfo(
                requests_per_minute=60,
                requests_per_hour=3600,
                requests_per_day=86400
            ),
            ProviderType.PERPLEXITY: RateLimitInfo(
                requests_per_minute=60,
                requests_per_hour=1000,
                requests_per_day=50000
            )
        }
    
    def _load_api_keys(self):
        """Load API keys from environment variables"""
        # OpenAI keys
        openai_keys = []
        for i in range(1, 11):  # Support up to 10 keys per provider
            key = os.getenv(f"OPENAI_API_KEY_{i}") or (os.getenv("OPENAI_API_KEY") if i == 1 else None)
            if key:
                openai_keys.append(key)
                self.key_usage[f"openai_{i}"] = KeyUsage(key_id=f"openai_{i}")
        
        if openai_keys:
            self.provider_keys[ProviderType.OPENAI] = openai_keys
            self.current_key_index[ProviderType.OPENAI] = 0
        
        # Google keys
        google_keys = []
        for i in range(1, 11):
            key = os.getenv(f"GOOGLE_API_KEY_{i}") or (os.getenv("GOOGLE_API_KEY") if i == 1 else None)
            if key:
                google_keys.append(key)
                self.key_usage[f"google_{i}"] = KeyUsage(key_id=f"google_{i}")
        
        if google_keys:
            self.provider_keys[ProviderType.GOOGLE] = google_keys
            self.current_key_index[ProviderType.GOOGLE] = 0
        
        # Groq keys
        groq_keys = []
        for i in range(1, 11):
            key = os.getenv(f"GROQ_API_KEY_{i}") or (os.getenv("GROQ_API_KEY") if i == 1 else None)
            if key:
                groq_keys.append(key)
                self.key_usage[f"groq_{i}"] = KeyUsage(key_id=f"groq_{i}")
        
        if groq_keys:
            self.provider_keys[ProviderType.GROQ] = groq_keys
            self.current_key_index[ProviderType.GROQ] = 0
        
        # Anthropic keys
        anthropic_keys = []
        for i in range(1, 11):
            key = os.getenv(f"ANTHROPIC_API_KEY_{i}") or (os.getenv("ANTHROPIC_API_KEY") if i == 1 else None)
            if key:
                anthropic_keys.append(key)
                self.key_usage[f"anthropic_{i}"] = KeyUsage(key_id=f"anthropic_{i}")
        
        if anthropic_keys:
            self.provider_keys[ProviderType.ANTHROPIC] = anthropic_keys
            self.current_key_index[ProviderType.ANTHROPIC] = 0
        
        # DeepSeek keys
        deepseek_keys = []
        for i in range(1, 11):
            key = os.getenv(f"DEEPSEEK_API_KEY_{i}") or (os.getenv("DEEPSEEK_API_KEY") if i == 1 else None)
            if key:
                deepseek_keys.append(key)
                self.key_usage[f"deepseek_{i}"] = KeyUsage(key_id=f"deepseek_{i}")
        
        if deepseek_keys:
            self.provider_keys[ProviderType.DEEPSEEK] = deepseek_keys
            self.current_key_index[ProviderType.DEEPSEEK] = 0

        # Perplexity keys
        perplexity_keys = []
        for i in range(1, 11):
            key = os.getenv(f"PPLX_API_KEY_{i}") or (os.getenv("PPLX_API_KEY") if i == 1 else None)
            if key:
                perplexity_keys.append(key)
                self.key_usage[f"perplexity_{i}"] = KeyUsage(key_id=f"perplexity_{i}")

        if perplexity_keys:
            self.provider_keys[ProviderType.PERPLEXITY] = perplexity_keys
            self.current_key_index[ProviderType.PERPLEXITY] = 0
        
        logger.info(f"Loaded API keys: {[(p.value, len(keys)) for p, keys in self.provider_keys.items()]}")
    
    def get_available_key(self, provider: ProviderType) -> Optional[tuple]:
        """Get an available API key for the provider"""
        if provider not in self.provider_keys:
            logger.error(f"No API keys configured for {provider.value}")
            return None
        
        keys = self.provider_keys[provider]
        rate_limits = self.rate_limits[provider]
        
        # Try to find a non-rate-limited key starting from current index
        for i in range(len(keys)):
            key_index = (self.current_key_index[provider] + i) % len(keys)
            key_id = f"{provider.value}_{key_index + 1}"
            
            if key_id in self.key_usage:
                usage = self.key_usage[key_id]
                if not usage.is_rate_limited(rate_limits):
                    # Update current key index for round-robin
                    self.current_key_index[provider] = key_index
                    return keys[key_index], key_id
        
        # All keys are rate limited
        logger.warning(f"All API keys for {provider.value} are rate limited")
        return None
    
    def record_request(self, provider: ProviderType, key_id: str, tokens: int = 0, success: bool = True):
        """Record a request for tracking"""
        if key_id in self.key_usage:
            usage = self.key_usage[key_id]
            if success:
                usage.add_request(tokens)
                usage.record_success()
                logger.debug(f"Recorded successful request for {key_id}")
            else:
                usage.record_error()
                logger.warning(f"Recorded error for {key_id}")
    
    def get_next_available_time(self, provider: ProviderType) -> Optional[datetime]:
        """Get the next time when a key will be available"""
        if provider not in self.provider_keys:
            return None
        
        keys = self.provider_keys[provider]
        rate_limits = self.rate_limits[provider]
        earliest_time = None
        
        for i, key in enumerate(keys):
            key_id = f"{provider.value}_{i + 1}"
            if key_id in self.key_usage:
                usage = self.key_usage[key_id]
                
                if usage.is_blocked and usage.block_until:
                    next_time = datetime.fromtimestamp(usage.block_until)
                else:
                    # Calculate when rate limits will reset
                    current_time = time.time()
                    
                    # Check minute limit
                    minute_requests = usage.get_requests_in_window(60)
                    if minute_requests >= rate_limits.requests_per_minute:
                        oldest_in_minute = min([t for t in usage.requests_count if current_time - t < 60])
                        next_time = datetime.fromtimestamp(oldest_in_minute + 60)
                    else:
                        next_time = datetime.now()
                
                if earliest_time is None or next_time < earliest_time:
                    earliest_time = next_time
        
        return earliest_time
    
    def get_provider_status(self, provider: ProviderType) -> Dict[str, Any]:
        """Get detailed status for a provider"""
        if provider not in self.provider_keys:
            return {"error": f"No keys configured for {provider.value}"}
        
        keys = self.provider_keys[provider]
        rate_limits = self.rate_limits[provider]
        key_statuses = []
        
        for i, key in enumerate(keys):
            key_id = f"{provider.value}_{i + 1}"
            if key_id in self.key_usage:
                usage = self.key_usage[key_id]
                key_statuses.append({
                    "key_id": key_id,
                    "is_rate_limited": usage.is_rate_limited(rate_limits),
                    "is_blocked": usage.is_blocked,
                    "requests_last_minute": usage.get_requests_in_window(60),
                    "requests_last_hour": usage.get_requests_in_window(3600),
                    "requests_last_day": usage.get_requests_in_window(86400),
                    "tokens_last_minute": usage.get_tokens_in_window(60),
                    "tokens_last_day": usage.get_tokens_in_window(86400),
                    "consecutive_errors": usage.consecutive_errors,
                    "block_until": datetime.fromtimestamp(usage.block_until).isoformat() if usage.block_until else None
                })
        
        available_keys = len([s for s in key_statuses if not s["is_rate_limited"] and not s["is_blocked"]])
        
        return {
            "provider": provider.value,
            "total_keys": len(keys),
            "available_keys": available_keys,
            "rate_limits": {
                "requests_per_minute": rate_limits.requests_per_minute,
                "requests_per_hour": rate_limits.requests_per_hour,
                "requests_per_day": rate_limits.requests_per_day,
                "tokens_per_minute": rate_limits.tokens_per_minute,
                "tokens_per_day": rate_limits.tokens_per_day
            },
            "keys": key_statuses,
            "next_available": self.get_next_available_time(provider).isoformat() if self.get_next_available_time(provider) else None
        }
    
    def get_all_status(self) -> Dict[str, Any]:
        """Get status for all providers"""
        return {provider.value: self.get_provider_status(provider) for provider in ProviderType}

# Global instance
api_key_manager = APIKeyManager()
