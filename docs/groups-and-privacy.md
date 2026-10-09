# Groups, friends, and who can borrow what

A plan, not built yet. It answers one question per copy, *who can see this book
and sign up for it?*, and makes the database enforce the answer.

## Principles

1. **Lending happens inside circles you chose.** Nothing is public by default.
2. **Nobody is put into anything.** You sign up for a line yourself; friend
   requests and group invites need a yes. This is the same rule as the line.
3. **Leaving is always possible.** Unfriend, leave a group, leave a line.
4. **Privacy lives in the database**, not the screen. Hiding something in the
   app while the API still returns it is not privacy.

## The pieces

| Piece | What it is | How you get in | How you get out |
| --- | --- | --- | --- |
| **Friend** | A mutual connection between two people | Request → accepted | Either side unfriends, silently |
| **Group** | A named circle, e.g. "Our Book Club", "The Traveling Pants" | Invited by a member and accept, or ask to join and an admin approves | Leave any time |
| **Book audience** | Who can see a copy and join its line | The owner picks one group when lending it | The owner can change it; the line keeps who's already in it |

**Groups are the lending boundary. Friends are social.** Friendship lets you
see each other's profile and activity and invite each other to groups. It
doesn't by itself let you borrow someone's books. This keeps one clear answer
to "who can borrow this": the people in its group.

(A "My friends" audience is the obvious extension. Leave it out until someone
asks, because every audience type is another case for every rule below.)

## Who sees what

| Thing | Visible to |
| --- | --- |
| A book, its line, its travel history | Members of its group, its owner, and whoever is holding it or waiting in its line |
| Letters | As above, and still sealed until you've finished the copy |
| A person's name and city | Themselves, their friends, people they share a group with, and anyone they've sent a friend request to |
| "People you may know" | Only people you already share a group with. Friends of friends are not shown, since that would reveal people who never shared anything with you |
| Search for any user | Doesn't exist. You find people through groups and invite links |

## Juhyae's case

> Juhyae only wants to be in our club. She doesn't want to lend to anyone else,
> or have strangers ask for her books.

- She's in one group, **Our Book Club**. Every copy she lends goes to that
  group, which is the default when you're in only one.
- Nobody outside the group can see her books, so nobody outside can join her
  lines. There's no "request" to refuse; the books are simply invisible.
- Nobody outside a group with her can see her profile at all. A stranger
  can't send her a friend request, because they can't find her.
- A setting on her profile, **Who can send me friend requests**:
  *People in my groups* (default) or *Nobody*.
- If she does friend someone outside the club, that person still can't see her
  club books, because friendship doesn't open books (see above).

## Edge cases, decided

- **Changing a book's group mid-journey.** People already in line stay in
  line; new sign-ups follow the new group.
- **Someone leaves the group while waiting in a line.** They're removed from
  the line.
- **Someone leaves the group while holding the book.** They still physically
  have it, so they keep seeing it until they pass it on or send it home.
- **The owner leaves the group.** The owner always sees their own books. The
  copy finishes its journey, comes home, and stops being lent until they put
  it in another group.
- **Unfriending.** Changes nothing about books (friendship never opened them).
- **Rereads, sealed letters, return home.** Unchanged.

## Data model

```
people           (renamed from friends) + user_id → auth.users, unique
friendships      requester, addressee, status: pending | accepted,
                 created_at, responded_at. Unfriend deletes the row.
                 Unique per pair in either direction.
groups           id, name, created_by, invite_code, created_at
group_members    group_id, person_id, role: admin | member,
                 status: invited | requested | active
books            + group_id (the audience)
people           + friend_requests_from: groups | nobody
```

The current `friendships` table has no status column, so every row today would
become `accepted`.

## Making the database enforce it

1. **Sign-in with Supabase Auth.** Email magic links first (no passwords to
   leak); Apple and Google later. Each `people` row is tied to `auth.uid()`.
   The welcome screen's "find yourself" list goes away.
2. **Helper functions in Postgres** (`security definer`, `stable`):
   `me()`, `is_member(group_id)`, `are_friends(a, b)`, `can_see_book(book_id)`.
3. **Row-level security on every table**, written with those helpers:
   - `books`, `reading_queue`, `handoffs`: select where `can_see_book(...)`.
   - `reading_queue` insert: only yourself, only on a book you can see.
   - `handoffs` insert: only from the current holder, and that holder is you.
   - `people`: select yourself, friends, co-members, and pending requests.
   - `friendships`: you can see and delete rows you're part of; only the
     addressee can accept.
4. **Multi-step writes become database functions.** A handoff is three writes
   today (leg plus two queue updates). One `pass_on(book, to, note, rating)`
   function makes it atomic and checked in one place.
5. **Collect less.** City only, never addresses. Email lives in `auth.users`,
   never in a table other people can read.
6. **Before strangers arrive:** account deletion, a privacy page, block and
   report, and Supabase rate limits on sign-in.

## Testing with the Carmen crew

Put the demo group in your real Supabase as a second, separate group,
**The Traveling Pants**, and check that the walls hold.

- **Before sign-in exists:** the dev bar's "view as" shows what each person's
  screen would show. Useful for the UI; proves nothing about privacy.
- **After sign-in:** make four real test accounts using email plus-addressing
  (`you+lena@…`, `you+carmen@…`) and actually sign in as them. In dev mode the
  bar switches between those accounts, using passwords from a gitignored file.
  Now the database is doing the hiding, which is what you need to test.
- **Checks:**
  - Lena can't see any of Our Book Club's books, people, or lines.
  - Juhyae can't see the Traveling Pants at all.
  - You (in both) see both groups, but nothing leaks across through you:
    Lena still can't see Juhyae via your profile or your activity.
  - A Pants member can't join an Our Book Club line by calling the API
    directly. Test with `curl` and their token, not just the app.

## Order of work

1. **Now:** roll out to your friend group as-is. First names and cities only;
   the database is still open.
2. **Friend requests and unfriend.** Small: a status column and two buttons.
3. **Groups and book audiences** in the app, plus the Carmen crew as a second
   group.
4. **Sign-in and row-level security**, with the test accounts above.
   **Required before anyone outside your friend group joins.**
5. **Then growth:** group invite links, QR bookplates inside covers.

## Open questions

- One group per copy, or can a copy be lent to several groups at once?
  (Recommended: one. It keeps the line and the letters in one circle.)
- Can anyone create a group, or only people already in one?
- Joining a group: invite only, or can people ask to join one they've heard
  of? (Recommended: invite link only, at first.)
