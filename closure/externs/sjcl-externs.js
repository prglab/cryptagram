var sjcl = {
    "cipher": {
        "aes": function () {}
    },
    "hash": {
        "sha256": function () {}
    },
    "keyexchange": function () {},
    "mode": {
        "ccm": {
            "name": {},
            "encrypt": function () {},
            "decrypt": function () {},
            "G": function () {},
            "I": function () {}
        },
        "ocb2": {
            "name": {},
            "encrypt": function () {},
            "decrypt": function () {},
            "pmac": function () {},
            "A": function () {}
        }
    },
    "misc": {
        "hmac": function () {},
        "pbkdf2": function () {},
        "S": function () {},
        "cachedPbkdf2": function () {}
    },
    "codec": {
        "utf8String": {
            "fromBits": function () {},
            "toBits": function () {}
        },
        "hex": {
            "fromBits": function () {},
            "toBits": function () {}
        },
        "base64": {
            "D": {},
            "fromBits": function () {},
            "toBits": function () {}
        },
        "base64url": {
            "fromBits": function () {},
            "toBits": function () {}
        }
    },
    "exception": {
        "corrupt": function () {},
        "invalid": function () {},
        "bug": function () {},
        "notReady": function () {}
    },
    "bitArray": {
        "bitSlice": function () {},
        "extract": function () {},
        "concat": function () {},
        "bitLength": function () {},
        "clamp": function () {},
        "partial": function () {},
        "getPartial": function () {},
        "equal": function () {},
        "P": function () {},
        "k": function () {}
    },
    "random": {
        "randomWords": function () {},
        "setDefaultParanoia": function () {},
        "addEntropy": function () {},
        "isReady": function () {},
        "getProgress": function () {},
        "startCollectors": function () {},
        "stopCollectors": function () {},
        "addEventListener": function () {},
        "removeEventListener": function () {}
        },
    "json": {
        "defaults": {
            "v": {},
            "iter": {},
            "ks": {},
            "ts": {},
            "mode": {},
            "adata": {},
            "cipher": {},
            "iv": {},
            "salt": {},
            "ct": {}
        },
        "encrypt": function () {},
        "decrypt": function () {},
        "encode": function () {},
        "decode": function () {},
        "c": function () {},
        "V": function () {},
        "W": function () {}
    },
    "encrypt": function () {},
    "decrypt": function () {}
}