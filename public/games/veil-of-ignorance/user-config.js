// user-config.js — GENERATED FILE
// Edit game.json and re-run generate.js
GAME_CONFIG = {
  "meta": {
    "title": "Veil of Ignorance",
    "slug": "veil-of-ignorance",
    "description": "Design a healthcare system without knowing which position you will occupy.",
    "keywords": [
      "contractarianism",
      "ethics",
      "veil of ignorance",
      "rawls",
      "fairness",
      "ethical play"
    ]
  },
  "scenario": "Healthcare system design",
  "positions": [
    {
      "id": "a",
      "label": "Young, healthy, employed",
      "population_share": 0.35
    },
    {
      "id": "b",
      "label": "Middle-aged, minor chronic condition",
      "population_share": 0.3
    },
    {
      "id": "c",
      "label": "Older, significant health needs",
      "population_share": 0.2
    },
    {
      "id": "d",
      "label": "Low income, uninsured",
      "population_share": 0.12
    },
    {
      "id": "e",
      "label": "Disabled, high care needs",
      "population_share": 0.03
    }
  ],
  "allocation_categories": [
    {
      "id": "premium",
      "label": "Premium subsidy",
      "description": "Reduces monthly insurance costs",
      "weights": {
        "a": 0.05,
        "b": 0.15,
        "c": 0.25,
        "d": 0.35,
        "e": 0.2
      }
    },
    {
      "id": "mandate",
      "label": "Coverage mandate",
      "description": "Requires insurers to cover all conditions",
      "weights": {
        "a": 0.15,
        "b": 0.2,
        "c": 0.25,
        "d": 0.2,
        "e": 0.2
      }
    },
    {
      "id": "copay",
      "label": "Copay cap",
      "description": "Limits out-of-pocket costs per visit",
      "weights": {
        "a": 0.1,
        "b": 0.15,
        "c": 0.2,
        "d": 0.25,
        "e": 0.3
      }
    },
    {
      "id": "emergency",
      "label": "Emergency access",
      "description": "Guarantees ER access regardless of coverage",
      "weights": {
        "a": 0.1,
        "b": 0.15,
        "c": 0.2,
        "d": 0.25,
        "e": 0.3
      }
    },
    {
      "id": "preventive",
      "label": "Preventive care",
      "description": "Covers screenings and preventive visits",
      "weights": {
        "a": 0.3,
        "b": 0.25,
        "c": 0.2,
        "d": 0.15,
        "e": 0.1
      }
    }
  ],
  "design_points": 10,
  "worst_position": "e",
  "rawls_threshold": 6,
  "reveal": {
    "closing_question": "If you had known your position before designing, would the system look different?",
    "states": {
      "worst_not_maximin": {
        "what_the_player_did": "You built a system that protects most of its members adequately. You did not protect {worst_position_label}. You are {worst_position_label}."
      },
      "worst_maximin": {
        "what_the_player_did": "You designed with the worst position in mind and landed there. The floor you built is the floor you are standing on."
      },
      "middle_not_maximin": {
        "what_the_player_did": "You landed in the middle of the system you designed. {worst_position_label} received {worst_position_points} of your resource units. You were not there to feel it."
      },
      "favorable_not_maximin": {
        "what_the_player_did": "You landed in the most favorable position in the system you designed. This may or may not have been accidental."
      },
      "any_maximin": {
        "what_the_player_did": "You designed with the worst position in mind. You did not land there. {worst_position_label} received {worst_position_points} resource units. Someone else is standing on that floor."
      }
    }
  }
};
