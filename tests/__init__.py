# Advanced Drone Surveillance System - Testing Framework
# This module contains comprehensive tests for all system components

import os
import sys
import pytest
import asyncio
import aiohttp
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Test configuration
TEST_CONFIG = {
    "base_url": "http://localhost:5000",
    "ai_url": "http://localhost:5800",
    "websocket_url": "ws://localhost:8080",
    "timeout": 30,
    "test_images_dir": "test_data/images",
    "test_videos_dir": "test_data/videos"
}

# Ensure test data directories exist
os.makedirs(TEST_CONFIG["test_images_dir"], exist_ok=True)
os.makedirs(TEST_CONFIG["test_videos_dir"], exist_ok=True) 