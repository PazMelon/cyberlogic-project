# Cyberboard & Gantt Chart: Frontend-Only Restrictions Audit

Analysis of frontend restrictions/validations that lack corresponding backend enforcement, creating potential bypass vulnerabilities via direct API calls.

---

## 🔴 Critical Findings (Missing Backend Validation)

### 1. Predecessor Completion Block — Frontend Only

| | Detail |
|---|---|
| **Frontend** | [CyberBoardView.tsx:L720-756](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/pages/CyberBoardView.tsx#L720-L756) |
| **Backend** | [CyberboardController.php — `moveCard()`](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L936-L1085) |

**What the frontend does:** When a card has predecessor tasks, the frontend blocks drag-and-drop moves to "completed/in-progress" columns if predecessors are still incomplete. It shows a toast like *"Cannot move: Predecessor task 'X' is not completed yet!"*

**What the backend does:** **Nothing.** The `moveCard()` endpoint has **zero** predecessor completion validation. It only checks column permissions and board view access.

> [!CAUTION]
> A user can bypass the predecessor restriction entirely by calling `PUT /api/cyberboard/cards/{id}/move` directly, skipping the completion dependency chain. This defeats the purpose of task dependency ordering.

**Suggested fix:** Add predecessor completion validation in `moveCard()` before executing the move — check if the target column is a "completed" or "in-progress" type and verify all predecessor cards are in completed columns.

---

### 2. Card Title & Description Length — No Frontend maxLength, Backend Enforces Silently

| | Detail |
|---|---|
| **Frontend (Card Create)** | [NewSuggestionModal.tsx](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/NewSuggestionModal.tsx) |
| **Frontend (Card Edit)** | [CardDetailModal.tsx:L808-827](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/CardDetailModal.tsx#L808-L827) |
| **Backend** | [CyberboardController.php:L545-546](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L545-L546) |

**What the frontend does:** The `<input>` for card title and `<textarea>` for description have **no** `maxLength` attribute. Users can type unlimited text.

**What the backend does:** Validates `title: max:200` and `description: max:2000`. On violation, it returns a 422 but the frontend has no proactive guard.

> [!WARNING]
> While the backend does enforce length limits, the frontend offers zero user feedback. Users can type 500+ chars for a title, hit submit, and get a confusing raw validation error. The UX should match the backend limits.

**Suggested fix:** Add `maxLength={200}` on title inputs and `maxLength={2000}` on description textareas in both `NewSuggestionModal` and `CardDetailModal` edit forms.

---

### 3. Board Title & Description Length — No Frontend maxLength

| | Detail |
|---|---|
| **Frontend** | [CreateBoardModal.tsx:L310-338](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/CreateBoardModal.tsx#L310-L338) & [BoardSettingsModal.tsx](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/BoardSettingsModal.tsx) |
| **Backend** | [CyberboardController.php:L314-315](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L314-L315) |

**What the frontend does:** Board title and description inputs have no `maxLength` restriction.

**What the backend does:** Validates `title: max:150` and `description: max:1000`.

**Suggested fix:** Add `maxLength={150}` on board title inputs and `maxLength={1000}` on description textareas.

---

### 4. Comment Length — No Frontend maxLength

| | Detail |
|---|---|
| **Frontend** | [CardDetailModal.tsx — comment input](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/CardDetailModal.tsx) |
| **Backend** | [CyberboardController.php:L1187](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1187) |

**What the backend does:** Validates `content: max:1000`.

**Suggested fix:** Add `maxLength={1000}` to the comment input/textarea.

---

### 5. Chat Message Length — No Frontend maxLength

| | Detail |
|---|---|
| **Frontend** | [CyberboardChatSidebar.tsx](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/CyberboardChatSidebar.tsx) |
| **Backend** | [CyberboardController.php:L1590](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1590) |

**What the backend does:** Validates `content: max:3000`.

**Suggested fix:** Enforce `maxLength={3000}` on the chat message input.

---

## 🟡 Medium Findings (Frontend Logic Divergence)

### 6. Gantt Dependency Linking — Not Gated by `canEditGantt`

| | Detail |
|---|---|
| **Frontend** | [GanttRoadmapView.tsx:L103-122](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/GanttRoadmapView.tsx#L103-L122) (remove dependency) and [L169-194](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/GanttRoadmapView.tsx#L169-L194) (add dependency via drag) |
| **Backend** | [CyberboardController.php:L738-752](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L738-L752) |

**What the frontend does:** The `handleRemoveDependency()` and drag-to-link `handleMouseUp()` functions call `updateCyberboardCard()` to modify `predecessor_ids` — but they **don't check `canEditGantt`** before initiating the action. The connector dot and remove-dependency buttons are visible to all users.

**What the backend does:** The `updateCard()` endpoint **does** check gantt edit policy when `predecessor_ids` is in the payload (L739-752), so unauthorized calls will be rejected. However, the UI misleadingly shows the interactive elements.

> [!IMPORTANT]
> The backend correctly blocks unauthorized dependency edits, but the frontend still renders the drag connector dots and remove-dependency buttons for users without `canEditGantt` permission, leading to confusing error messages.

**Suggested fix:** Gate the dependency link connector dot (L2150-2158) and `handleRemoveDependency` behind `canEditGantt`.

---

### 7. BoardCard Delete — Missing `isHost` in Frontend Check

| | Detail |
|---|---|
| **Frontend** | [BoardCard.tsx:L34-35](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/BoardCard.tsx#L34-L35) |
| **Backend** | [CyberboardController.php:L886](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L886) |

**What the frontend does:** `const canDelete = isOwner || isAdmin;` — The board **host** is not included.

**What the backend does:** `if ($card->user_id !== $user->id && !$isAdmin)` — Only card owner or admin. Board host is also **not** included here.

**What CardDetailModal does:** [CardDetailModal.tsx:L599](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/cyberboard/CardDetailModal.tsx#L599) uses `const canDeleteCard = isOwner || isHost || isAdmin;` — **includes** `isHost`.

> [!WARNING]
> There's an inconsistency between `BoardCard.tsx` and `CardDetailModal.tsx` for who can delete cards. The detailed modal gives the board host deletion power but the card component on the board doesn't. Neither backend nor `BoardCard` recognize `isHost` as a card deleter. Decide which is the intended behavior and align both frontend and backend.

**Suggested fix:** If board hosts should be able to delete any card on their board, add `$board->created_by === $user->id` check in the backend's `destroyCard()` and add `isHost` to `BoardCard.tsx`. If not, remove `isHost` from `CardDetailModal.tsx`.

---

### 8. Chat Pin — Any Board Viewer Can Pin/Unpin Messages

| | Detail |
|---|---|
| **Backend** | [CyberboardController.php:L1633-1664](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1633-L1664) |

**What the backend does:** `togglePinBoardChatMessage()` only checks `canUserViewBoard()` — meaning **any member** who can see the board can pin/unpin any message. There's no restriction to host/admin.

> [!NOTE]
> This may be intentional (collaborative pinning), but it could also be an oversight. Most platforms restrict pinning to moderators/admins.

**Suggested fix:** Consider restricting pin/unpin to board host + admins, or at minimum the message author + host + admins.

---

### 9. Board Asset Upload/Link — No Board View Check

| | Detail |
|---|---|
| **Backend** | [CyberboardController.php:L1849-1884](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1849-L1884) and [L1890-1939](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1890-L1939) |

**What the backend does:** `storeBoardLinkAsset()` and `storeBoardFileAsset()` use `findOrFail($boardId)` but **never** call `canUserViewBoard()`. Any authenticated user can upload assets to any board, including private boards they don't have access to.

> [!CAUTION]
> This is a backend authorization gap. Assets can be injected into private boards by unauthorized users via direct API calls.

**Suggested fix:** Add `canUserViewBoard($board, $user)` check in both `storeBoardLinkAsset()` and `storeBoardFileAsset()`.

---

### 10. Card Attachment Upload — No Board/Card Ownership Verification

| | Detail |
|---|---|
| **Backend** | [CyberboardController.php:L1485-1505](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/CyberboardController.php#L1485-L1505) |

**What the backend does:** `uploadAttachment()` accepts any file upload from any authenticated user. It has **no** board ID or card ID context — it just stores the file and returns a URL. The returned URL can then be attached to any card.

> [!NOTE]
> This is a generic file upload endpoint, so it's somewhat acceptable. However, it means any authenticated user can consume server storage through card attachment uploads regardless of board membership. Consider adding rate limiting or board context validation.

---

## 🟢 Well-Protected Areas (Backend ✅)

These areas have proper backend enforcement matching or exceeding frontend restrictions:

| Feature | Frontend Gate | Backend Gate | Status |
|---------|--------------|-------------|--------|
| Board create (non-admin limit to 1 active) | ❌ No frontend check | ✅ Backend enforces 1-board limit | Backend-only (good) |
| System category boards | ✅ Hides option for non-admins | ✅ Returns 403 | ✅ Both |
| Board pin/unpin | ✅ UI hidden for non-admins | ✅ Admin-only check | ✅ Both |
| Board update/delete | ✅ UI hidden for non-host/admin | ✅ Owner or admin check | ✅ Both |
| Column create (policy-based) | ✅ `canCreateColumn` logic | ✅ `canUserCreateColumn()` | ✅ Both |
| Column update/delete | ✅ UI gated to host/admin | ✅ Host/admin check | ✅ Both |
| Card create (column permissions) | ✅ Filters allowed columns | ✅ Column role/user check | ✅ Both |
| Card edit (column permissions) | ✅ `canEditCard` logic | ✅ `canUserEditCardInColumn()` | ✅ Both |
| Card move (column permissions) | ✅ Source & target check | ✅ Source & target check | ✅ Both |
| Gantt date drag (resize/move) | ✅ `canEditGantt` + `handleResizeStart()` | ✅ `canUserEditGantt()` | ✅ Both |
| Gantt batch reorder | ✅ (implicit via drag gate) | ✅ `canUserEditGantt()` | ✅ Both |
| Card vote (private board) | ✅ (implicit) | ✅ `canUserViewBoard()` | ✅ Both |
| Comment (private board) | ✅ (implicit) | ✅ `canUserViewBoard()` | ✅ Both |
| Comment delete | ✅ Owner/admin UI gate | ✅ Owner/admin check | ✅ Both |
| Private board view | ✅ Access screen | ✅ `canUserViewBoard()` | ✅ Both |
| Join request response | ✅ Host/admin UI gate | ✅ Host/admin check | ✅ Both |

---

## Summary of Recommended Actions

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Predecessor completion block — frontend only | Add backend validation in `moveCard()` |
| 9 | 🔴 Critical | Board asset upload — no `canUserViewBoard` check | Add view check in asset upload endpoints |
| 6 | 🟡 Medium | Gantt dependency link/remove — UI not gated by `canEditGantt` | Gate connector dot & remove button behind `canEditGantt` |
| 7 | 🟡 Medium | Card delete — inconsistent `isHost` between components | Align `BoardCard.tsx`, `CardDetailModal.tsx`, and backend |
| 8 | 🟡 Medium | Chat pin — any viewer can pin/unpin | Consider restricting to host/admin |
| 2-5 | 🟢 Low | Missing `maxLength` on title/desc/comment/chat inputs | Add `maxLength` attributes matching backend limits |
| 10 | 🟢 Low | Card attachment upload — no board context | Consider rate limiting |
