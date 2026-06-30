# Enhancing your RAG System

For those who want to go further, here are three advanced extensions to the RAG
system: **RAGAS (RAG Assessment)**, a **Gatekeeper**, and **Conversational
RAG**.

---

## 1. RAGAS – RAG Assessment

Your system works, but how do you know if it’s _good_? And what happens when you
make changes, how do you track that you haven't degraded the quality? The
solution is to add an evaluation layer

The most popular RAG evaluation layer is
[RAGAS](https://github.com/explodinggradients/ragas), but this uses python

If you're comfortable setting up a python server to host your RAGAS - great.
Otherwise you can implement a slimmer, simpler RAGAS version. Either option is
fine

---

#### Option 1: Set up your own node-JS, simple RAGAS system

1. Manually write 10 Q&A pairs (questions with ground truth answers; that is,
   answers you _know_ are correct and accurate)

2. For each question:

   - Run your RAG system to generated an answer
   - Ask your LLM to score how similar the generated is to the ground truth
     answer on a scale of 1–10

3. Parse the scores, average them, and you'll have a rough score of how accurate
   your RAG system is (above 80 is good, above 90 is excellent)

This is very minimal but still gives you a quick sense of quality

⸻

#### Option 2: Use the real RAGAS with Python

[RAGAS docs](https://github.com/explodinggradients/ragas)

- Same principle (create a set of ground-truth Q&As)
- But you run them through an open source, validated assessment system

---

## 2. Gatekeeper – Filtering Non-Informative Data

Right now you’re dumping _everything_ into the knowledge base. Slack messages
like _"lol"_ or _"any updates?"_ add no value. Build a **Gatekeeper** step to
filter noise before storage.

### Requirements

- Run a lightweight classifier before embeddings
  - This can be a simple call to your LLM asking "is this information useful?"
  - Of course, _useful_ is subjective, so you'll need a better system prompt
    than that
- Only pass "informative" chunks to embeddings + DB
- Track rejections in logs so you can debug what’s being filtered

---

## 3. Bonus: Conversational RAG

Currently your system is single-shot Q&A. To support multi-turn conversations,
extend it into **Conversational RAG**

### Tasks

1. **Retain conversation history**

   - You can save the entire conversation history (in memory is fine for now,
     though for production you would want a DB of course)
     - But in this case you'd have to cut off the user before hitting the
       context limit
   - Or save the last X messages, and a summary everything before that

2. **Send full context**

   - Include conversation history along with the retrieved knowledge chunks when
     constructing the prompt

3. **Distinguish between question types**

   - If the question requires knowledge-base retrieval, run RAG
   - If it’s small-talk or general (e.g., "how are you?"), fall back to direct
     LLM response without retrieval
   - You can use your LLM for this classification ("Is this a knowledge-seeking
     question about lev-boots or general conversation?").

---

## Deliverables

- Build a separate script (not the main UI) to run RAGAS evaluation.
- Extend your `loadAllData` pipeline with a Gatekeeper.
- Update your `ask` function to support Conversational RAG.

---

### Why These Matter

- **RAGAS**: Without evaluation, you can’t measure progress/track quality
- **Gatekeeper**: Saves tokens, improves quality, and keeps your KB clean
- **Conversational RAG**: Moves from Q&A → true dialogue, making the system feel
  natural and human
