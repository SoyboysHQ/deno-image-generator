# Docker Container Name Fix

## Issue

The docker test scripts were looking for a container named `image-generator-test`, but the Makefile uses `instagram-generator-app`. This caused tests to fail even when a container was running.

### Error Message
```
⚠️  Container 'image-generator-test' is not running
Start it with: ./docker-test-build.sh
```

### Root Cause

**Two different container names:**
- **Makefile** (production): `instagram-generator-app`
- **Test scripts** (before fix): `image-generator-test`

Running `make docker-restart` would restart `instagram-generator-app`, but test scripts were looking for `image-generator-test`.

## Solution

All test scripts now use the **same container name** as the Makefile: `instagram-generator-app`

### Implementation

Added to each test script:
```bash
# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"
```

This allows:
1. **Default behavior**: Uses `instagram-generator-app`
2. **Environment override**: Can set `DOCKER_CONTAINER` env var for custom names
3. **Consistency**: Works with both `make` commands and direct scripts

## Fixed Scripts

All 7 test scripts updated:
- ✅ `docker-test-build.sh`
- ✅ `docker-test-health.sh`
- ✅ `docker-test-image.sh`
- ✅ `docker-test-carousel.sh`
- ✅ `docker-test-reel.sh`
- ✅ `docker-test-all.sh`
- ✅ `docker-test-cleanup.sh`

## Now You Can

### Use Either Approach

**Option 1: Using Makefile**
```bash
make docker-start        # Start container
make docker-test-reel    # Test reel endpoint ✅
```

**Option 2: Using Scripts**
```bash
./docker-test-build.sh   # Start container
./docker-test-reel.sh    # Test reel endpoint ✅
```

**Option 3: Mix and Match**
```bash
make docker-start        # Start with make
./docker-test-reel.sh    # Test with script ✅
```

### All Commands Work Together

```bash
# Start with make
make docker-start

# Test with scripts
./docker-test-health.sh    ✅
./docker-test-image.sh     ✅
./docker-test-carousel.sh  ✅
./docker-test-reel.sh      ✅

# Stop with make
make docker-stop
```

## Benefits

✅ **Single container** - No confusion about which container to use
✅ **Works with make** - `make docker-restart` now works with tests
✅ **Consistent behavior** - All commands use same container
✅ **Easy debugging** - One container to check logs for
✅ **Resource efficient** - Don't need multiple containers

## Testing

Verified working:
```bash
$ docker ps
CONTAINER ID   IMAGE                  ...   NAMES
65184c691b0b   instagram-generator   ...   instagram-generator-app

$ make docker-test-reel
✅ Reel generated successfully
```

## Advanced: Custom Container Name

If you need a custom container name:

```bash
export DOCKER_CONTAINER=my-custom-container
./docker-test-build.sh  # Creates 'my-custom-container'
./docker-test-reel.sh   # Tests 'my-custom-container'
```

## Summary

**Before:** Two container names = confusion ❌
**After:** One container name = seamless ✅

Now `make docker-restart` (or `make docker-start`) **does** suffice! 🎉

