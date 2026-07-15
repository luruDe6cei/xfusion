# xFUSION Clone

A local rebuild of xfusion.pro — an open-innovation platform where organizations
publish Challenges and solution providers publish Solutions. This file is the
project glossary; implementation decisions live in the ADRs (codebase-memory MCP),
current state in `HANDOFF.md`.

## Language

### Platform

**Challenge**:
A business problem an organization publishes to attract external solution partners.

**Solution**:
A provider's offering that can address one or more Challenges.

**Organization**:
The entity that owns Challenges and Solutions.
_Avoid_: company (in UI copy — the data model keeps `Company`)

**Domain**:
The top-level classification of a Challenge (e.g. Agriculture); the data model calls it Industry.
_Avoid_: sector, vertical

**Category**:
The secondary classification of a Challenge; the data model calls it SubIndustry.

**Incentives Information**:
The partnership/reward offer text of a Challenge.
_Avoid_: prize, budget

**Required Expertise**:
The expertise areas a solver should bring to a Challenge.

**Required Deployment Time**:
The timeframe in which the organization needs a solution deployed.

**Publish**:
Making a Challenge publicly visible; anything unpublished is invisible outside its creator.

### Challenge Wizard

**Challenge Wizard**:
The five-step guided flow for creating a Challenge: Basic Information → Objectives & Requirements → Incentives & Supporting Data → AI Assistance → Review.
_Avoid_: form, intake page

**Splash Screen**:
The introductory screen shown before the Wizard's first step, dismissible with "Don't show me again".

**Step Status**:
Whether a Wizard step is untouched, in progress, or complete; shown on the stepper and preserved when navigating back.

**Chat Dock**:
The persistent conversational assistant in the Wizard sidebar that interviews the user and proposes Field Updates.
_Avoid_: intake chat, copilot, chatbot

**Field Update**:
A set of Challenge field values the Chat Dock proposes from the conversation.

**Touched Field**:
A field the user has manually edited; it is never changed by anything except an explicit user accept.

**Improve Button**:
The per-field ✨ affordance that rewrites that field's text within the field's scope and shows the result as a preview to accept or reject.
_Avoid_: AI button, magic wand

**Help Me Write**:
The AI Assistance step's action that proposes improved versions of every text field at once, each individually acceptable.

**Tips**:
Step-specific sidebar guidance, generated from the conversation and current field values, with static fallbacks.

**Draft**:
Wizard progress saved on the user's own device; not published and not in the database.

**Supporting Documents**:
Files attached to a Challenge during creation.
_Avoid_: attachments, uploads

## Relationships

- The **Challenge Wizard** produces exactly one **Challenge** on **Publish**
- A **Challenge** is classified by one **Domain** and at most one **Category**
- The **Chat Dock** proposes **Field Updates**; an untouched field applies them automatically, a **Touched Field** only via explicit accept
- **Tips** are derived from the **Chat Dock** conversation and the current field values
- **Supporting Documents** belong to the **Challenge** being created

## Example dialogue

> **Dev:** "If the **Chat Dock** learns the budget mid-conversation, does it write **Incentives Information** directly?"
> **Domain expert:** "Only while that field is untouched. Once the user typed there it's a **Touched Field** — the dock proposes a **Field Update** and the user applies it, same accept gesture as an **Improve Button** preview."
> **Dev:** "And going back from Review?"
> **Domain expert:** "Every step keeps its **Step Status** and values — Back never loses anything, and a refresh restores the **Draft**."

## Flagged ambiguities

- "Domain" vs "Industry" — same concept: UI copy says Domain, the data model says Industry. Use Domain when talking about the UI, Industry for the model.
- "Example panel" — the real site's sidebar Example is replaced by the **Chat Dock** in our Wizard; don't design against it.
- "Draft" — on the real site drafts are server-side; here a Draft lives only on the user's device. Saying "saved" to the user must not imply it's on the server.
