export const IDL = {
  "address": "CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp",
  "metadata": {
    "name": "defi_quest",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "DeFi Quest Engine - Mission/Quest system for Solana dApps"
  },
  "instructions": [
    {
      "name": "claim_reward",
      "docs": [
        "Claim reward after completing mission"
      ],
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "progress",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "mission"
              }
            ]
          }
        },
        {
          "name": "mission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mission.mission_id",
                "account": "Mission"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "reward_vault",
          "writable": true,
          "optional": true
        },
        {
          "name": "user_token_account",
          "writable": true,
          "optional": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "token_program",
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "deactivate_mission",
      "docs": [
        "Deactivate a mission"
      ],
      "discriminator": [
        202,
        54,
        243,
        231,
        164,
        32,
        245,
        22
      ],
      "accounts": [
        {
          "name": "mission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mission.mission_id",
                "account": "Mission"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the quest program"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "register_mission",
      "docs": [
        "Register a new mission"
      ],
      "discriminator": [
        219,
        46,
        41,
        229,
        151,
        222,
        229,
        86
      ],
      "accounts": [
        {
          "name": "mission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "mission_id"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mission_id",
          "type": "string"
        },
        {
          "name": "mission_type",
          "type": {
            "defined": {
              "name": "MissionType"
            }
          }
        },
        {
          "name": "requirement",
          "type": {
            "defined": {
              "name": "MissionRequirement"
            }
          }
        },
        {
          "name": "reward",
          "type": {
            "defined": {
              "name": "MissionReward"
            }
          }
        },
        {
          "name": "metadata_uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "start_mission",
      "docs": [
        "Start a mission for a user"
      ],
      "discriminator": [
        220,
        224,
        41,
        25,
        46,
        134,
        254,
        157
      ],
      "accounts": [
        {
          "name": "progress",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "mission"
              }
            ]
          }
        },
        {
          "name": "mission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mission.mission_id",
                "account": "Mission"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "submit_proof",
      "docs": [
        "Submit proof of mission completion (swap signature)"
      ],
      "discriminator": [
        54,
        241,
        46,
        84,
        4,
        212,
        46,
        94
      ],
      "accounts": [
        {
          "name": "progress",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "mission"
              }
            ]
          }
        },
        {
          "name": "mission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mission.mission_id",
                "account": "Mission"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "swap_signature",
          "type": "string"
        },
        {
          "name": "swap_amount",
          "type": "u64"
        },
        {
          "name": "input_token",
          "type": "pubkey"
        },
        {
          "name": "output_token",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "Mission",
      "discriminator": [
        170,
        56,
        116,
        75,
        24,
        11,
        109,
        12
      ]
    },
    {
      "name": "UserProgress",
      "discriminator": [
        195,
        16,
        25,
        215,
        192,
        49,
        107,
        204
      ]
    }
  ],
  "events": [
    {
      "name": "MissionCompletedEvent",
      "discriminator": [
        89,
        61,
        65,
        64,
        175,
        75,
        197,
        184
      ]
    },
    {
      "name": "MissionProgressEvent",
      "discriminator": [
        130,
        65,
        30,
        127,
        15,
        228,
        136,
        255
      ]
    },
    {
      "name": "MissionRegisteredEvent",
      "discriminator": [
        78,
        103,
        73,
        98,
        198,
        171,
        158,
        26
      ]
    },
    {
      "name": "MissionStartedEvent",
      "discriminator": [
        91,
        47,
        141,
        161,
        140,
        170,
        158,
        92
      ]
    },
    {
      "name": "RewardClaimedEvent",
      "discriminator": [
        246,
        43,
        215,
        228,
        82,
        49,
        230,
        56
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MissionIdTooLong",
      "msg": "Mission ID too long (max 32 chars)"
    },
    {
      "code": 6001,
      "name": "MetadataUriTooLong",
      "msg": "Metadata URI too long (max 200 chars)"
    },
    {
      "code": 6002,
      "name": "MissionInactive",
      "msg": "Mission is not active"
    },
    {
      "code": 6003,
      "name": "AlreadyCompleted",
      "msg": "Mission already completed"
    },
    {
      "code": 6004,
      "name": "AlreadyClaimed",
      "msg": "Reward already claimed"
    },
    {
      "code": 6005,
      "name": "NotCompleted",
      "msg": "Mission not completed yet"
    },
    {
      "code": 6006,
      "name": "InvalidSignature",
      "msg": "Invalid swap signature format"
    },
    {
      "code": 6007,
      "name": "WrongToken",
      "msg": "Wrong token for mission requirement"
    },
    {
      "code": 6008,
      "name": "AmountTooLow",
      "msg": "Swap amount below minimum requirement"
    },
    {
      "code": 6009,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6010,
      "name": "UnsupportedMissionType",
      "msg": "Mission type not supported"
    }
  ],
  "types": [
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mission_count",
            "type": "u64"
          },
          {
            "name": "total_completions",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Mission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mission_id",
            "type": "string"
          },
          {
            "name": "mission_type",
            "type": {
              "defined": {
                "name": "MissionType"
              }
            }
          },
          {
            "name": "requirement",
            "type": {
              "defined": {
                "name": "MissionRequirement"
              }
            }
          },
          {
            "name": "reward",
            "type": {
              "defined": {
                "name": "MissionReward"
              }
            }
          },
          {
            "name": "metadata_uri",
            "type": "string"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "completions",
            "type": "u64"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MissionCompletedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "completed_at",
            "type": "i64"
          },
          {
            "name": "proof",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "MissionProgressEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "current_value",
            "type": "u64"
          },
          {
            "name": "target_value",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MissionRegisteredEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "mission_id",
            "type": "string"
          },
          {
            "name": "mission_type",
            "type": {
              "defined": {
                "name": "MissionType"
              }
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "MissionRequirement",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "input_token",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "output_token",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "min_amount",
            "type": "u64"
          },
          {
            "name": "target_volume",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "streak_days",
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "MissionReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "xp",
            "type": "u64"
          },
          {
            "name": "badge_type",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "token_mint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "token_amount",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "MissionStartedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "started_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "MissionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Swap"
          },
          {
            "name": "Volume"
          },
          {
            "name": "Streak"
          },
          {
            "name": "DCA"
          },
          {
            "name": "Prediction"
          }
        ]
      }
    },
    {
      "name": "RewardClaimedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "xp",
            "type": "u64"
          },
          {
            "name": "token_amount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "badge_type",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "UserProgress",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mission",
            "type": "pubkey"
          },
          {
            "name": "started_at",
            "type": "i64"
          },
          {
            "name": "completed",
            "type": "bool"
          },
          {
            "name": "completed_at",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "claimed_at",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "current_value",
            "type": "u64"
          },
          {
            "name": "swap_signatures",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};