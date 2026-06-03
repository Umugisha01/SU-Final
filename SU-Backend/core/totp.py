import os
import hmac
import base64
import struct
import hashlib
import time

class TOTPHelper:
    """
    Cryptographic implementation of Time-Based One-Time Password (TOTP)
    algorithm according to RFC 6238.
    """
    @staticmethod
    def generate_secret():
        # Generate 20 random bytes and base32 encode
        random_bytes = os.urandom(20)
        return base64.b32encode(random_bytes).decode('utf-8')

    @staticmethod
    def get_provisioning_uri(secret, email, issuer_name="SU Connect"):
        # standard OTP auth URI format
        email_escaped = urllib_parse_quote(email)
        issuer_escaped = urllib_parse_quote(issuer_name)
        return f"otpauth://totp/{issuer_escaped}:{email_escaped}?secret={secret}&issuer={issuer_escaped}"

    @staticmethod
    def verify_code(secret, code):
        try:
            # Decode key from base32
            key = base64.b32decode(secret, casefold=True)
            # Fetch current time step (30s intervals)
            time_step = int(time.time() / 30)
            
            # Check window (-1, 0, +1) to allow for minor time drift
            for offset in [-1, 0, 1]:
                counter = struct.pack(">Q", time_step + offset)
                hmac_hash = hmac.new(key, counter, hashlib.sha1).digest()
                
                # Dynamic truncation
                offset_idx = hmac_hash[-1] & 0x0F
                code_bytes = hmac_hash[offset_idx:offset_idx + 4]
                val = struct.unpack(">I", code_bytes)[0] & 0x7FFFFFFF
                
                # Calculate 6 digit pin
                calculated_pin = str(val % 1000000).zfill(6)
                if calculated_pin == str(code).strip():
                    return True
            return False
        except Exception:
            return False

def urllib_parse_quote(val):
    import urllib.parse
    return urllib.parse.quote(val)
