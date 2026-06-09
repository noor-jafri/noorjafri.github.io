# RAG Was Cute. Then I Built F.A.G.

> *"You will not name it that," they said. I named it that.*

Let's get the elephant out of the inn first: **F.A.G.** stands for **File-Augmented Generation**. Yes, the acronym is unfortunate. No, I will not be taking questions. Tech naming has always been cursed (FART, BUTT, COBOL); I'm just continuing the tradition.

Now — why does it exist?

## The problem with RAG

RAG (Retrieval-Augmented Generation) is great until it isn't. You chunk your documents, embed them, store the vectors, and at query time you fetch the top-k chunks and stuff them into the prompt. It works. It also:

- Forces you to *re-embed* whenever your source changes.
- Loses *structure* — a chunk of `auth.py` is just text floating in vector space, with no idea it lives next to `auth_test.py`.
- Hides *relationships* — folder structure, naming conventions, imports, the whole filesystem semantics — all flattened into similarity scores.
- Gets weird with code, where exact tokens matter and "semantically similar" can mean "compiles differently."

For our use case at [DeepMask.io](https://deepmask.io) — letting AI agents reason about whole codebases and document trees — RAG felt like reading a library by shuffling all the pages and then guessing which fell out of which book.

## What F.A.G. does

F.A.G. flips the model. Instead of vectorizing files, it lets the agent **traverse them like a Linux greybeard with a flashlight**:

- `ls`-style listings of directories.
- `cat`/`head`/`tail`-style reads with offsets.
- `grep`-style scoped searches.
- File-swap semantics: page sections in and out of context the way an OS pages memory.

The model sees the *shape* of the project — directories, file names, sizes — and decides what to open next. The filesystem is the index. The agent is the query planner. No embeddings required.

## Why it works

Three reasons:

1. **Modern LLMs already understand filesystems.** They've read every README on Earth. Hand them a file tree and they know what to do.
2. **Structure is signal.** `src/auth/middleware.ts` next to `src/auth/middleware.test.ts` tells you more than any cosine distance ever could.
3. **It's idempotent.** No re-embedding when the source changes. The "index" updates the moment a file does — because the index *is* the files.

## Where it loses

F.A.G. isn't free:

- You burn more tokens on navigation than RAG does on retrieval. Caching matters.
- Latency goes up if your agent over-explores. Prompt it tight.
- It's worse than RAG for purely semantic queries on huge unstructured corpora ("find me articles vaguely about X across 10M docs"). Use RAG there.

For codebases, runbooks, structured docs, and anything where the *layout* carries meaning — F.A.G. wins.

## The point

Treat models like applications. Treat tokens like coin. Treat the filesystem like a database that's already been written for you. The next great retrieval pattern probably isn't a new vector store — it's just `find` and `cat` with better manners.

Now stop snickering at the acronym.

— *Noor, currently slaying the model-fragmentation hydra at DeepMask*
