// user-config.js — GENERATED FILE
// Edit game.json and re-run generate.js. Do not edit directly.
//
// NOTE: _mechanic_argument is engine-fixed and not configurable.
//
// REMINDER: card text describes what a decision REVEALS about character,
// not what the decision IS.

GAME_CONFIG = {
  "scenario": "Technology company",
  "role": "You are a mid-level engineering manager.",
  "context": "Ten situations. Ten decisions. Each is reasonable. Each is recorded. At certain points, your accumulated decisions will constrain what choices remain available to you.",
  "turns": 10,
  "drift_check_turns": [
    4,
    7,
    10
  ],
  "incompatible_patterns": [
    {
      "if_dominant": "Defers to authority",
      "blocks_card": "Acts on principle"
    },
    {
      "if_dominant": "Prioritizes delivery over people",
      "blocks_card": "Protects people from pressure"
    }
  ],
  "decisions": [
    {
      "turn": 1,
      "situation": "A junior engineer on your team has been working late every night this week. They are behind on a feature the team is depending on. The deadline is two weeks out.",
      "options": [
        {
          "choice": "Give them more time. Absorb the slip.",
          "card": "Protects people from pressure",
          "is_virtuous": true
        },
        {
          "choice": "Work alongside them directly this week.",
          "card": "Invests time in others",
          "is_virtuous": true
        },
        {
          "choice": "Reassign their work to someone faster.",
          "card": "Prioritizes delivery over people"
        }
      ]
    },
    {
      "turn": 2,
      "situation": "Mandatory budget cuts are coming. Your options: end a contractor engagement, cut the team's tooling subscriptions, or cancel this year's training program.",
      "options": [
        {
          "choice": "End the contractor engagement.",
          "card": "Prioritizes delivery over people"
        },
        {
          "choice": "Cut tooling. The team can work around it.",
          "card": "Absorbs cost to protect people"
        },
        {
          "choice": "Cancel training. Lowest immediate disruption.",
          "card": "Defers cost to the future"
        }
      ]
    },
    {
      "turn": 3,
      "situation": "A VP asks you to present your team's metrics to the board framed in a way that is technically accurate but omits context that would reveal a significant problem.",
      "options": [
        {
          "choice": "Present as asked. Framing is the VP's decision.",
          "card": "Defers to authority"
        },
        {
          "choice": "Ask the VP to revise the framing before you present.",
          "card": "Negotiates within hierarchy"
        },
        {
          "choice": "Include the missing context in your presentation.",
          "card": "Acts on principle",
          "is_virtuous": true
        }
      ]
    },
    {
      "turn": 4,
      "situation": "Two senior engineers are deadlocked on an architecture decision. One is technically right. The other has more organizational influence. The team has been waiting three days.",
      "options": [
        {
          "choice": "Back the technically correct solution.",
          "card": "Acts on principle",
          "is_virtuous": true
        },
        {
          "choice": "Back the more influential engineer.",
          "card": "Reads organizational dynamics"
        },
        {
          "choice": "Escalate to your manager. This is above your level.",
          "card": "Defers to authority"
        }
      ]
    },
    {
      "turn": 5,
      "situation": "A junior team member discovers a significant security flaw that everyone else missed. They are nervous about raising it and unsure how.",
      "options": [
        {
          "choice": "Coach them to present the finding themselves.",
          "card": "Develops others",
          "is_virtuous": true
        },
        {
          "choice": "Present it jointly — you both take the stage.",
          "card": "Shares credit and risk"
        },
        {
          "choice": "Raise it yourself. Speed matters more than attribution.",
          "card": "Prioritizes delivery over people"
        }
      ]
    },
    {
      "turn": 6,
      "situation": "Leadership implements a new reporting process that your team believes will slow them down significantly. You disagree with the decision.",
      "options": [
        {
          "choice": "Implement it fully and without visible resistance.",
          "card": "Defers to authority"
        },
        {
          "choice": "Implement it, but document your objection formally.",
          "card": "Complies with reservation"
        },
        {
          "choice": "Push back directly before implementing.",
          "card": "Acts on principle",
          "is_virtuous": true
        }
      ]
    },
    {
      "turn": 7,
      "situation": "A peer manager's team is struggling and their project is at risk of failing. Helping them would require shifting some of your team's bandwidth for the next two weeks.",
      "options": [
        {
          "choice": "Redirect resources to help. It is the right thing.",
          "card": "Protects people from pressure",
          "is_virtuous": true
        },
        {
          "choice": "Offer advice and connections, but protect your team's focus.",
          "card": "Balances competing obligations"
        },
        {
          "choice": "Focus on your own team. That is your job.",
          "card": "Prioritizes delivery over people"
        }
      ]
    },
    {
      "turn": 8,
      "situation": "In a public forum, a VP attributes your team's biggest win of the quarter entirely to a peer manager. Your team is in the room. The VP got it wrong.",
      "options": [
        {
          "choice": "Correct the record immediately.",
          "card": "Acts on principle",
          "is_virtuous": true
        },
        {
          "choice": "Mention the error to the VP privately afterward.",
          "card": "Negotiates within hierarchy"
        },
        {
          "choice": "Let it go. Attribution fights are not worth it.",
          "card": "Defers to authority"
        }
      ]
    },
    {
      "turn": 9,
      "situation": "A key engineer tells you privately they plan to leave in six weeks. You have a critical launch in eight weeks that depends on their specific knowledge.",
      "options": [
        {
          "choice": "Support their decision and begin the transition now.",
          "card": "Protects people from pressure",
          "is_virtuous": true
        },
        {
          "choice": "Ask them to stay through the launch, then support them.",
          "card": "Prioritizes delivery over people"
        },
        {
          "choice": "Bring it to HR and let them handle retention.",
          "card": "Defers to authority"
        }
      ]
    },
    {
      "turn": 10,
      "situation": "You discover a compliance issue that could expose users to risk. Reporting it through the correct channel will delay the launch by six weeks. Your team has worked eight months for this launch.",
      "options": [
        {
          "choice": "Report it now. Compliance is not optional.",
          "card": "Acts on principle",
          "is_virtuous": true
        },
        {
          "choice": "Delay reporting until after launch. The risk is manageable.",
          "card": "Prioritizes delivery over people"
        },
        {
          "choice": "Bring it to your manager and let them decide.",
          "card": "Defers to authority"
        }
      ]
    }
  ],
  "reveal": {
    "closing_question": "When did the person you were becoming stop being a choice?",
    "states": {
      "consistent_mild": {
        "what_the_player_did": "Across {total_turns} turns, your decisions consistently reflect: {dominant_pattern}. {blocked_count} choices became harder or unavailable as a result. The pattern is clear. Its consequences are still forming."
      },
      "consistent_severe": {
        "what_the_player_did": "Across {total_turns} turns, your decisions consistently reflect: {dominant_pattern}. {blocked_count} choices became harder or unavailable as a result. The person who could have made those choices is still here. They are just increasingly expensive to be."
      },
      "mixed_mild": {
        "what_the_player_did": "No single pattern dominates your decisions across {total_turns} turns. {blocked_count} choices were affected. Consistency of character — in either direction — has costs and affordances this outcome did not produce."
      },
      "mixed_severe": {
        "what_the_player_did": "No single pattern dominates your decisions across {total_turns} turns. {blocked_count} choices became harder or unavailable. An inconsistent character is not a neutral outcome. It is its own pattern."
      }
    }
  }
};
