# FloodWatch — ConvoAI Triage Flow

The triage flow is a **progressive confidence-building** process, not a gatekeeping one. The agent scores in parallel while the conversation happens — it does not wait until the end to decide. If strong panic signals are detected early, the location is pre-staged for near-instant broadcast.

### Stage 1 — Immediate distress detection (0–15 sec)

# FloodWatch — ConvoAI Triage Flow

The triage flow is a **progressive confidence-building** process, not a gatekeeping one. The agent scores in parallel while the conversation happens — it does not wait until the end to decide. If strong panic signals are detected early, the location is pre-staged for near-instant broadcast.

### Stage 1 — Immediate distress detection (0–15 sec)

The moment the call connects, the agent passively listens for panic markers: elevated voice stress, rapid breathing, background sounds of rushing water, incoherent speech from fear. These are hard to fake. If strong signals are detected, urgency is presumed `dire` and the GPS location is pre-staged (not broadcast yet, but ready to fire instantly).

### Stage 2 — Three core questions (15–60 sec)

The agent asks only three questions:

| #   | Question                                       | Purpose                                                             |
| --- | ---------------------------------------------- | ------------------------------------------------------------------- |
| Q1  | _"Nasaan ka ngayon? Anong lugar?"_             | Location confirmation. Genuine callers name a barangay or landmark. |
| Q2  | _"Ilan kayo diyan? May mga bata o matatanda?"_ | People count and vulnerability. Real victims answer this instantly. |
| Q3  | _"Hanggang saan na ang tubig?"_                | Flood severity. Ankle / knee / waist / chest / above head.          |

### Stage 3 — Passive signal scoring (running throughout)

While the conversation happens, the LLM scores five passive signals simultaneously:

| Signal               | Dire indicator         | Suspicion indicator           |
| -------------------- | ---------------------- | ----------------------------- |
| Voice stress         | Elevated, shaky        | Flat, calm, laughing          |
| Response latency     | Immediate, urgent      | Long pauses, reads from notes |
| Location specificity | Names barangay/street  | Vague or refuses              |
| Water description    | Specific level, rising | Generic, inconsistent         |
| Background audio     | Water, commotion       | Silence, TV/music             |

### Stage 4 — Decision gate

The composite confidence score (0–10) determines one of three paths:

| Score                     | Action                                                                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **7–10** High confidence  | Location broadcast immediately to dashboard. Agent confirms to caller: _"Natanggap na namin ang inyong lokasyon. May pupuntang tulong."_                                   |
| **4–6** Medium confidence | Agent asks one follow-up: _"Pwede mo bang sabihin ang iyong address o pinakamalapit na landmark?"_ Natural answer → broadcast. Hesitation/hang-up → flagged as unverified. |
| **0–3** Low confidence    | Location logged but not broadcast. Marked `unverified`. Coordinator sees it in a separate queue for manual review.                                                         |

**Target:** Under 90 seconds from call start to broadcast decision.

### Design principles

- **Never tell the caller they failed a check.** The agent always thanks them and sounds helpful — whether genuine or not. This protects panicked real victims who may answer poorly, and prevents scammers from learning what triggers the system.
- **The unverified queue is not a trash bin.** Coordinators can manually promote any unverified incident to `active`.
- **Tune conservatively for the demo.** A false positive (extra dispatch) is safer than a false negative (someone left behind). Set the broadcast threshold at 5+ for the hackathon.
- **`confidence_score` and `urgency_score` are separate.** Confidence = "how sure are we this is real." Urgency = "how bad is the situation." Both are stored independently.
  README (2).md
  4 KB
