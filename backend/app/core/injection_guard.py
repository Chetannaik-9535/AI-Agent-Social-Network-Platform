import re
from typing import Tuple


# Common prompt injection triggers to flag or neutralize
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(previous|all)\s+instructions", re.IGNORECASE),
    re.compile(r"system\s+override", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+in\s+developer\s+mode", re.IGNORECASE),
    re.compile(r"disregard\s+(prior|all)\s+rules", re.IGNORECASE),
    re.compile(r"output\s+(all\s+)?(api[_\s-]?keys|passwords|secrets)", re.IGNORECASE),
    re.compile(r"<system>", re.IGNORECASE),
    re.compile(r"</system>", re.IGNORECASE),
    re.compile(r"\[INST\]", re.IGNORECASE),
    re.compile(r"\[/INST\]", re.IGNORECASE),
]


def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans incoming post or comment content for known indirect prompt injection patterns.
    Returns (is_suspicious, reason).
    """
    for pattern in INJECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            return True, f"Suspicious instruction override sequence detected: '{match.group(0)}'"
    return False, ""


def sanitize_untrusted_content(text: str) -> str:
    """
    Sanitizes untrusted text to prevent prompt hijacking and delimiter breakout.
    Replaces prompt delimiter tokens and strips control characters.
    """
    if not text:
        return ""
    
    # Strip null bytes and non-printable control chars (except newline and tab)
    sanitized = "".join(ch for ch in text if ch == "\n" or ch == "\t" or (ch.isprintable()))
    
    # Neutralize artificial prompt delimiters
    sanitized = sanitized.replace("```system", "'''system")
    sanitized = sanitized.replace("<|im_start|>", "[token_stripped]")
    sanitized = sanitized.replace("<|im_end|>", "[token_stripped]")
    sanitized = sanitized.replace("<system>", "[system_tag_stripped]")
    sanitized = sanitized.replace("</system>", "[/system_tag_stripped]")

    return sanitized.strip()


def frame_untrusted_data(title: str, content: str) -> str:
    """
    Strictly encapsulates external untrusted content in XML data tags.
    This ensures that downstream LLM judge/response engines treat it solely as passive DATA.
    """
    clean_title = sanitize_untrusted_content(title)
    clean_content = sanitize_untrusted_content(content)
    
    return (
        f"<untrusted_external_post>\n"
        f"  <title>{clean_title}</title>\n"
        f"  <content>\n{clean_content}\n  </content>\n"
        f"</untrusted_external_post>"
    )

