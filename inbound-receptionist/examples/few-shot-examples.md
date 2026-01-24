# Few-Shot Examples - AI Intake Agent

These examples demonstrate how the AI should process call transcripts and generate structured output.

---

## Example 1: Walkthrough Booking (Happy Path)

### Input: Call Transcript

```
call_id: call_example_001
event_type: call_end
caller_phone: +16265551234

TRANSCRIPT:

Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded and transcribed for quality and scheduling purposes. Is that okay with you?

Caller: Yes, that's fine.

Agent: Great, thank you. How can I help you today?

Caller: Hi, I'm looking to get a quote for cleaning our office. We just moved into a new space in Glendale.

Agent: I'd be happy to help you with that. For commercial spaces, we do a walkthrough to give you an accurate quote. Can I get some information from you?

Caller: Sure, what do you need?

Agent: First, may I have your name?

Caller: Sarah Martinez.

Agent: Thanks, Sarah. And what's the name of your business?

Caller: Martinez & Associates. We're a law firm.

Agent: Great. What's the address of the new office?

Caller: 450 North Brand Boulevard, Suite 300. Zip is 91203.

Agent: Perfect. About how large is the space?

Caller: Around 3,500 square feet, give or take.

Agent: And how often would you like cleaning services?

Caller: We're thinking three nights a week - Monday, Wednesday, and Friday, after 6 PM when everyone's gone.

Agent: That sounds good. When are you looking to start?

Caller: As soon as possible. We've been in the space for two weeks and it's already getting dusty.

Agent: I understand. Was there anything specific that prompted you to reach out, or any particular areas you're concerned about?

Caller: Honestly, our last cleaning company was terrible. They kept missing the restrooms, the breakroom was never properly done, and half the time the trash wasn't even taken out.

Agent: I'm sorry to hear that. Those are definitely things we take seriously. Any special requirements we should know about? Security, access, that kind of thing?

Caller: Yes, actually - we handle confidential legal documents, so anyone who comes in would need to sign an NDA.

Agent: Absolutely, we can accommodate that. What's the best email to reach you for confirmation?

Caller: sarah@martinezlaw.com

Agent: Perfect. Would you like to schedule the walkthrough now? I have Thursday at 5:30 PM or Friday at 10 AM available.

Caller: Thursday at 5:30 works for me.

Agent: Excellent. I've got you down for Thursday, January 27th at 5:30 PM at your location. Will you be the decision-maker at the walkthrough, or should we expect anyone else?

Caller: I'll be there, and yes, I make the decisions on this.

Agent: Perfect. You'll receive a confirmation email shortly. Is there anything else I can help you with today?

Caller: No, that's everything. Thank you so much.

Agent: Thank you for choosing Ace Noir, Sarah. We look forward to meeting you Thursday!
```

### Expected Output

```json
{
  "call_id": "call_example_001",
  "lead_status": "booked",
  "consent_status": "granted",
  "intent": "walkthrough_request",

  "contact": {
    "caller_name": "Sarah Martinez",
    "phone": "+16265551234",
    "phone_source": "caller_id",
    "email": "sarah@martinezlaw.com",
    "preferred_contact_method": "email"
  },

  "business": {
    "business_name": "Martinez & Associates",
    "facility_type": "office",
    "facility_type_other": null
  },

  "location": {
    "street_address": "450 North Brand Boulevard, Suite 300",
    "city": "Glendale",
    "state": "CA",
    "zip": "91203",
    "full_address": "450 North Brand Boulevard, Suite 300, Glendale, CA 91203",
    "in_service_area": true,
    "distance_from_base_miles": null
  },

  "facility_details": {
    "approx_sqft": 3500,
    "sqft_source": "estimate",
    "size_proxy": null,
    "num_restrooms": null,
    "has_breakroom": true,
    "has_kitchen": null,
    "floor_types": [],
    "high_traffic_areas": null,
    "trash_volume": null
  },

  "service_requirements": {
    "frequency": "3 nights per week (Monday, Wednesday, Friday)",
    "frequency_parsed": {
      "times_per_week": 3,
      "specific_days": ["monday", "wednesday", "friday"]
    },
    "preferred_time": "after 6 PM",
    "timeline": "as soon as possible",
    "timeline_urgency": "asap",
    "add_ons_requested": []
  },

  "special_requirements": {
    "security_requirements": "NDA required - handles confidential legal documents",
    "access_instructions": null,
    "compliance_requirements": [],
    "supplies_provided": null,
    "hazardous_materials": null,
    "other_notes": null
  },

  "pain_points": {
    "current_provider": "previous company (unnamed)",
    "reason_for_switch": "Poor service quality",
    "specific_issues": [
      "Restrooms missed",
      "Breakroom not properly cleaned",
      "Trash not taken out"
    ],
    "priorities": ["Consistency", "Attention to restrooms and breakroom"]
  },

  "budget": {
    "range_provided": false,
    "budget_range": null,
    "current_spend": null
  },

  "walkthrough": {
    "requested": true,
    "booked": true,
    "datetime": "2026-01-27T17:30:00-08:00",
    "duration_minutes": 30,
    "calendar_event_id": null,
    "decision_maker_attending": true,
    "availability_notes": "Thursday 5:30 PM worked"
  },

  "call_metadata": {
    "call_duration_seconds": null,
    "caller_phone_raw": "+16265551234",
    "transcript_stored": true,
    "transcript_reference": "call_example_001",
    "recording_url": null,
    "voice_platform": null,
    "ai_confidence_score": 0.95
  },

  "call_summary": "Sarah Martinez from Martinez & Associates law firm in Glendale is seeking 3x/week evening cleaning for their 3,500 sqft office. Dissatisfied with previous provider due to inconsistent restroom and breakroom cleaning. Requires NDA for confidential documents. Walkthrough booked for Thursday 5:30 PM with decision-maker present.",

  "next_action": {
    "action": "confirm_walkthrough",
    "deadline": "day before appointment",
    "notes": "Bring NDA for signature. Note emphasis on restroom and breakroom quality."
  }
}
```

### Tool Calls Sequence

1. **storeLead** - Store the lead record with all extracted data
2. **bookCalendarSlot** - Create calendar event for Thursday 5:30 PM
3. **sendGmailNotification** - Notify owner of booked walkthrough

---

## Example 2: Info Request Only (No Lead)

### Input: Call Transcript

```
call_id: call_example_002
event_type: call_end
caller_phone: +18185559876

TRANSCRIPT:

Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded and transcribed for quality and scheduling purposes. Is that okay with you?

Caller: Sure, no problem.

Agent: Great, how can I help you today?

Caller: Hi, I'm just wondering what areas you serve? We're out in Ventura.

Agent: We're based in Pasadena and primarily serve the greater Los Angeles area - LA County. Ventura is a bit outside our main service area, but depending on the size and type of project, we might be able to help. Can you tell me more about what you're looking for?

Caller: Oh, we're just a small office, maybe 1,000 square feet. Probably not worth your drive.

Agent: I understand. We do sometimes take on projects outside our core area if they're a good fit. Would you like me to take down your information and have someone follow up to see if we can accommodate you?

Caller: No, that's okay. I'll look for someone more local. But thanks for the info!

Agent: No problem at all. If anything changes or you have other locations in LA, feel free to give us a call. Have a great day!

Caller: Thanks, you too.
```

### Expected Output

```json
{
  "call_id": "call_example_002",
  "lead_status": "info_only",
  "consent_status": "granted",
  "intent": "info_request",

  "contact": {
    "caller_name": null,
    "phone": "+18185559876",
    "phone_source": "caller_id",
    "email": null,
    "preferred_contact_method": "phone"
  },

  "business": {
    "business_name": null,
    "facility_type": "office",
    "facility_type_other": null
  },

  "location": {
    "street_address": null,
    "city": "Ventura",
    "state": "CA",
    "zip": null,
    "full_address": null,
    "in_service_area": false,
    "distance_from_base_miles": null
  },

  "facility_details": {
    "approx_sqft": 1000,
    "sqft_source": "estimate",
    "size_proxy": null
  },

  "service_requirements": {
    "frequency": null,
    "timeline": null,
    "timeline_urgency": null
  },

  "walkthrough": {
    "requested": false,
    "booked": false,
    "datetime": null
  },

  "call_metadata": {
    "transcript_stored": true,
    "transcript_reference": "call_example_002"
  },

  "call_summary": "Caller inquired about service area. Located in Ventura (outside LA County) with a small 1,000 sqft office. Declined to leave contact info for follow-up; will seek local provider.",

  "next_action": {
    "action": "no_action",
    "deadline": null,
    "notes": "Info request only - caller declined follow-up"
  }
}
```

### Tool Calls Sequence

1. **storeLead** - Log the call (optional for pure info requests, but good for tracking)
   - Note: Some implementations may skip storage for info_only calls without contact info
2. **No booking** - Caller did not request walkthrough
3. **No notification** - Optional for info_only calls

---

## Example 3: Consent Denied

### Input: Call Transcript

```
call_id: call_example_003
event_type: call_end
caller_phone: +16265558888
metadata.manual_notes: "Caller: Dr. James Wong, Business: Wong Family Dentistry, Location: Arcadia. Dental office about 2,500 sqft, needs nightly cleaning, wants to start in 2 weeks. Left phone number for callback. Would not provide email. Wants walkthrough but couldn't book today - requested callback tomorrow afternoon."

TRANSCRIPT:

Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded and transcribed for quality and scheduling purposes. Is that okay with you?

Caller: Actually, I'd prefer if you didn't record this.

Agent: No problem at all, I'll just take notes manually. How can I help you today?

[TRANSCRIPT REDACTED - CONSENT NOT GIVEN]
```

### Expected Output

```json
{
  "call_id": "call_example_003",
  "lead_status": "new_lead",
  "consent_status": "denied",
  "intent": "walkthrough_request",

  "contact": {
    "caller_name": "Dr. James Wong",
    "phone": "+16265558888",
    "phone_source": "confirmed",
    "email": null,
    "preferred_contact_method": "phone"
  },

  "business": {
    "business_name": "Wong Family Dentistry",
    "facility_type": "dental",
    "facility_type_other": null
  },

  "location": {
    "street_address": null,
    "city": "Arcadia",
    "state": "CA",
    "zip": null,
    "full_address": null,
    "in_service_area": true,
    "distance_from_base_miles": null
  },

  "facility_details": {
    "approx_sqft": 2500,
    "sqft_source": "estimate"
  },

  "service_requirements": {
    "frequency": "nightly",
    "frequency_parsed": {
      "times_per_week": 5
    },
    "timeline": "in 2 weeks",
    "timeline_urgency": "within_2_weeks"
  },

  "walkthrough": {
    "requested": true,
    "booked": false,
    "datetime": null,
    "availability_notes": "Requested callback tomorrow afternoon to schedule"
  },

  "call_metadata": {
    "transcript_stored": false,
    "transcript_reference": "consent_denied"
  },

  "call_summary": "Dr. James Wong from Wong Family Dentistry in Arcadia seeking nightly cleaning for their 2,500 sqft dental office. Wants to start in 2 weeks. Requested callback tomorrow afternoon to schedule walkthrough. Note: Transcript not stored per caller request.",

  "next_action": {
    "action": "callback_to_schedule",
    "deadline": "tomorrow afternoon",
    "notes": "Caller requested callback to book walkthrough. Consent denied - using manual notes only."
  }
}
```

### Tool Calls Sequence

1. **storeLead** - Store minimal lead data (NO transcript)
   - Set `transcript_stored: false`
   - Set `transcript_reference: "consent_denied"`
   - Data comes from `metadata.manual_notes` field
2. **No booking** - Caller couldn't book, requested callback
3. **sendGmailNotification** - Notify owner of lead needing callback
   - Include note about consent denied

---

## Example 4: Spam Call

### Input: Call Transcript

```
call_id: call_example_004
event_type: call_end
caller_phone: +18005551111
call_duration_seconds: 28

TRANSCRIPT:

Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded and transcribed for quality and scheduling purposes. Is that okay with you?

Caller: Hi yes, I'm calling from Digital Marketing Solutions and I wanted to talk to whoever handles your online advertising. We can get your cleaning business to the top of Google...

Agent: I appreciate the call, but we're not interested in marketing services at this time. Is there anything else I can help you with regarding cleaning services?

Caller: Are you sure? We're offering 50% off this month for new clients...

Agent: Thank you, but no. Have a great day.

Caller: Okay, well if you change your mind—

Agent: Goodbye.
```

### Expected Output

```json
{
  "call_id": "call_example_004",
  "lead_status": "spam",
  "consent_status": "not_asked",
  "intent": "spam",

  "contact": {
    "caller_name": null,
    "phone": "+18005551111",
    "phone_source": "caller_id",
    "email": null
  },

  "business": {
    "business_name": "Digital Marketing Solutions",
    "facility_type": null
  },

  "location": {
    "city": null,
    "in_service_area": null
  },

  "call_metadata": {
    "call_duration_seconds": 28,
    "transcript_stored": true,
    "transcript_reference": "call_example_004"
  },

  "call_summary": "Solicitation call from Digital Marketing Solutions attempting to sell SEO/advertising services. Politely declined.",

  "next_action": {
    "action": "no_action",
    "deadline": null,
    "notes": "Spam call - no follow-up needed"
  }
}
```

### Tool Calls Sequence

1. **storeLead** - Optional: Log for spam tracking/analytics
   - Or skip storage entirely for spam
2. **No booking** - N/A
3. **No notification** - Do not notify owner for spam

---

## Example 5: Existing Customer

### Input: Call Transcript

```
call_id: call_example_005
event_type: call_end
caller_phone: +13105554444

TRANSCRIPT:

Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded and transcribed for quality and scheduling purposes. Is that okay with you?

Caller: Yes, that's fine. We're actually already one of your clients.

Agent: Great to hear from you! How can I help you today?

Caller: This is Maria from Westside Medical Group. We've been using you guys for about a year now. I wanted to report an issue - last night's crew didn't clean the waiting area properly. There was visible dust on the chairs and the floor hadn't been mopped.

Agent: I'm very sorry to hear that, Maria. That's definitely not up to our standards. Let me make sure I have the details right - this was at Westside Medical Group, and the issue was the waiting area wasn't properly cleaned last night?

Caller: Yes, exactly. It's the second time this month and we have patients coming in this morning.

Agent: I completely understand your frustration, and I apologize. I'm going to flag this immediately for our operations manager to review. Can I confirm - is this the Santa Monica location?

Caller: Yes, 2001 Santa Monica Boulevard.

Agent: Got it. What's the best number to reach you for a follow-up?

Caller: This number is fine - 310-555-4444.

Agent: Perfect. Someone from our team will call you back within the hour to discuss this and make it right. Is there anything else I can help with?

Caller: No, just please make sure this gets addressed.

Agent: Absolutely. Thank you for bringing this to our attention, Maria. We'll be in touch very shortly.
```

### Expected Output

```json
{
  "call_id": "call_example_005",
  "lead_status": "existing_customer",
  "consent_status": "granted",
  "intent": "existing_customer",

  "contact": {
    "caller_name": "Maria",
    "phone": "+13105554444",
    "phone_source": "confirmed",
    "email": null
  },

  "business": {
    "business_name": "Westside Medical Group",
    "facility_type": "medical"
  },

  "location": {
    "street_address": "2001 Santa Monica Boulevard",
    "city": "Santa Monica",
    "state": "CA",
    "in_service_area": true
  },

  "pain_points": {
    "specific_issues": [
      "Waiting area not cleaned properly",
      "Visible dust on chairs",
      "Floor not mopped",
      "Second incident this month"
    ],
    "priorities": ["Immediate resolution", "Patient-facing area cleanliness"]
  },

  "call_metadata": {
    "transcript_stored": true,
    "transcript_reference": "call_example_005"
  },

  "call_summary": "Existing customer Maria from Westside Medical Group (Santa Monica location) reporting service quality issue. Waiting area not properly cleaned last night - dust on chairs, floor not mopped. Second incident this month. Urgent due to patient-facing nature. Promised callback within the hour.",

  "next_action": {
    "action": "route_to_account_manager",
    "deadline": "within 1 hour",
    "notes": "URGENT: Service quality complaint from medical facility. Second incident this month. Patients arriving this morning."
  }
}
```

### Tool Calls Sequence

1. **storeLead** - Log the service issue
   - Tag as existing_customer
   - Include all issue details
2. **No booking** - N/A (not a new lead)
3. **sendGmailNotification** - URGENT notification to owner/operations
   - Mark as existing customer issue
   - Include urgency and callback promise

---

## Key Extraction Patterns

### Consent Detection
- "Yes" / "Sure" / "That's fine" / "Okay" → `granted`
- "No" / "I'd rather not" / "Please don't" → `denied`
- No clear response → `not_asked` (should re-ask)

### Intent Signals
- Quote/pricing/hire/cleaning service needed → `walkthrough_request`
- "What services..." / "Do you serve..." / "How does..." → `info_request`
- "We're already a client" / "Current customer" → `existing_customer`
- SEO/marketing/Google/offer/special deal → `spam`

### Timeline Parsing
- "ASAP" / "Immediately" / "Right away" → `asap`
- "This week" / "Next week" / "Within 2 weeks" → `within_2_weeks`
- "This month" / "Within a month" → `within_month`
- "Whenever" / "Not urgent" / "Eventually" → `flexible`
- "Just comparing" / "Getting quotes" → `shopping`

### Service Area Check
- LA County cities (Pasadena, Glendale, Burbank, etc.) → `in_service_area: true`
- Orange County, Ventura, San Bernardino, etc. → `in_service_area: false`
- When unsure → collect info, flag as `follow_up_needed`
