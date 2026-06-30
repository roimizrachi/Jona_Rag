# Running the project

- Ensure `concurrently` is installed (`npm install concurrently --save-dev`)
- Run `npm i`
- Create a `.env` file inside your `/server` directory with your `DATABASE_URL`
  connection string
- Run `npm run dev` in the *root* directory - this runs the front and backend concurrently with hot module
  and auto server reload
- See the UI at [http://localhost:5173/](http://localhost:5173/)

# Exercise: Lev-Boots RAG System

## Overview

Lev-Boots are a new invention that allow the wearer to levitate and hover
around. There are several resources about this new technology, its development,
and its applications.

Your task is to implement a Retrieval-Augmented Generation (RAG) system that
allows a user to ask and learn about these new boots.

The UI is already set up for you: you type a question, press enter, and it sends
it to the backend. Your task is to implement the entire RAG system on the
backend: from loading and embedding the resources, to retrieving the knowledge
and generating an answer.

Your entry point is in `ragService.ts`

---

## Setup

### Database
You will need your own postgres database for this project. If you don't have one set up locally, I **highly recommend** using [supabase](https://supabase.com/) - it takes 90 seconds to set up and get the credentials.

### Environment Variables

Create a `.env` file in the `server/` directory with DATABASE_URL and GEMINI_API_KEY
(or your preferred LLM)

- The database must be **Postgres with pgvector** (local or Supabase)
- Migrations run automatically when you start the server (including enabling the
  pg vector) – no manual step required aside from creating the DB

### Data Sources

When you run your server for the first time, it will automatically create a
`knowledge_base` table for you (assuming your connection string to your DB is
valid). You should familiarize yourself with the model in
`models/KnowledgeBase.ts`

_Note_: This table is fine for this project, but in reality you would likely
want to split into multiple tables that are joined (e.g one for the chunks, one
for the embeddings). For simplicity, we have everything in one table

Your first goal should be to populate your `knowledge_base` table with the
following data:

- **3 PDFs**
  - All the PDFs are in the `/knowledge_pdfs` directory; read directly from
    there:
    - `OpEd - A Revolution at Our Feet.pdf`
    - `Research Paper - Gravitational Reversal Physics.pdf`
    - `White Paper - The Development of Localized Gravity Reversal Technology.pdf`
  - You can `npm install pdf-parse` (see
    [here](https://www.npmjs.com/package/pdf-parse)) to read the PDFs easily
- **5 articles**
  - All the articles are accessible in markdown format via this endpoint:
    `https://gist.githubusercontent.com/JonaCodes/394d01021d1be03c9fe98cd9696f5cf3/raw/article-X_ARTICLE_ID.md`
  - You'll have to replace X with the numbers 1-5, and ARTICLE_ID with the
    following IDs:
    `[military-deployment-report, urban-commuting, hover-polo, warehousing, consumer-safety]`
- **Slack API** (simulated API with pagination + rate limiting)
  - This API limits how much data it returns per query, so you will have to
    paginate through
  - There are three different slack channels
  - Example access:
    - `https://lev-boots-slack-api.jona-581.workers.dev/?channel=lab-notes&page=1`
    - `https://lev-boots-slack-api.jona-581.workers.dev/?channel=engineering&page=2`
    - `https://lev-boots-slack-api.jona-581.workers.dev/?channel=offtopic&page=3`

### LLM via API

You will also need API access to an LLM. You can use any you like, but if you
want something for free (with rate limiting), you can use Google's Gemini

- Here is a simple guide to setting it up:
  https://ai.google.dev/gemini-api/docs/quickstart#javascript
- You will need an API key which you can get for free here:
  https://aistudio.google.com/app/apikey?
  - Press the `Create API Key` button on the top right
- **Note** as per the Gemini documentation, you can reduce token usage (hence
  increase your rate limit) by disabling thinking. For this project, it's safe
  to turn thinking off.
  - To turn thinking off, add the following to your API request:

```
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
    }
```

---

## Requirements

Ultimately, you need to implement the two functions below

#### `loadAllData`

- Fetch all sources
- Chunk content into manageable pieces (400 words)
- Embed each chunks
  ([Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings) or
  another embedding model)
- Store chunks + embeddings into the `knowledge_base` table

<span style="color:#fa5252">**IMPORTANT NOTE** on embeddings</span>

- The project already setup the `knowledge_base` table for you
- This table includes one of two columns in which you can store your embeddings:
  - `embeddings_768`
  - `embeddings_1536`
- These numbers indicate the embedding dimensions (i.e how long the embeddings
  array is, i.e how many parameters in has)
- You must choose _one_ and stick with it for the entire project (either 768
  _or_ 1536)
- The reason the project offers both is because different LLMs offer different
  defaults, though you can customize the dimension output in your embedding
  request
- In theory, more embeddings = more precision (but slower speed with higher
  costs), in practice, smaller embeddings can be fine for non-complex tasks (and
  are faster + cheaper)

<span style="color:#fa5252">**END of IMPORTANT NOTE** on embeddings</span>

#### `ask(userQuestion)`

- Embed (you must use the same embedding model) the question
- Run a similarity search on the DB
- Construct a prompt using the retrieved chunks
- Ask the LLM to answer the user question **based only on retrieved content**
- Return the answer to the UI

## Notes

1. I recommend you split your work to separate files - one (likely more) for
   loading, chunking, embedding, and storing the data, and another for answering
   the question

2. Since there is quite a lot of data to embed, you will be hitting the gemini
   API quite a lot. To avoid hitting rate limits, it's probably a good idea to
   start with something small, make sure it works, and avoid re-sending already
   embedded data so you can save tokens

3. This is a big project, but it's 100% feasible. You've got this =]

## Result

**Answering a question correctly**
<img width="990" height="427" alt="image" src="https://github.com/user-attachments/assets/cc8563ed-6d7c-4254-af83-e76ee18c8351" />

**Not hallucinating**
<img width="988" height="418" alt="image" src="https://github.com/user-attachments/assets/939fc8d5-6cc4-402d-9b17-d050afc4876d" />
