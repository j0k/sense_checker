# Political dimension topics (actual to today)

This document describes how Sense Checker uses **political dimensions** to score content and how a **wind rose** (compass-style) visualization can represent one or more axes.

---

## What the extension does

You define **two topics** (e.g. **proRussian** vs **proUkrainian**) and optional **keyword lists** for each. The extension scores a video’s title and description by counting keyword matches and shows where the content sits on that axis (e.g. 70% Topic A · 30% Topic B). Optionally, an AI (OpenAI, DeepSeek, etc.) can judge the same dimension.

The result can be shown as:
- a **horizontal bar** (Topic A ←——•——→ Topic B), or  
- a **wind rose** (compass): one axis through the circle (e.g. West = Topic A, East = Topic B) with a needle or point showing the score.

---

## Wind rose idea

A **wind rose** is a circular diagram with directions (N, S, E, W and often NE, NW, SE, SW). In politics we can use it to show **several dimensions at once**:

| Direction | Example axis (actual to today) |
|-----------|--------------------------------|
| **W ↔ E** | Pro-Russia stance ↔ Pro-Ukraine / pro-Western stance |
| **S ↔ N** | Authoritarian / statist ↔ Libertarian / civil liberties |
| (future)  | More axes: e.g. climate action ↔ scepticism, open borders ↔ closed borders |

- **One axis (current):** The extension uses a single axis (Topic A ↔ Topic B). On the wind rose this is the **West–East** line: West = Topic A, East = Topic B. The needle angle shows the score (e.g. 70% A = needle toward W).
- **Multiple axes (future):** With more topic pairs, each could map to another diameter (N–S, NE–SW, etc.), so one diagram shows several dimensions like a real wind rose.

---

## Political dimension topics relevant today

Examples of topic pairs you can configure (Settings → Political dimension). Keywords are comma-separated; you can edit them.

### 1. Russia–Ukraine / West (default)

- **Topic A (West):** e.g. `proRussian`  
  Keywords: `russia, putin, kremlin, moscow, donbass, russian army, russian forces, novorossiya`
- **Topic B (East):** e.g. `proUkrainian`  
  Keywords: `ukraine, zelensky, kyiv, ukrainian army, ukrainian forces, ukrainian, donbas`

*Axis on wind rose: W = proRussian, E = proUkrainian.*

### 2. US / global polarization

- **Topic A:** e.g. `conservative`  
  Keywords: `conservative, republican, trump, right-wing, border, tradition`
- **Topic B:** e.g. `progressive`  
  Keywords: `progressive, democrat, biden, left-wing, climate action, equality`

### 3. Climate and energy

- **Topic A:** e.g. `climate action`  
  Keywords: `climate, renewable, green, emissions, net zero, transition`
- **Topic B:** e.g. `sceptic / fossil`  
  Keywords: `sceptic, fossil, oil, gas, nuclear, cost, jobs`

### 4. Migration and borders

- **Topic A:** e.g. `open borders`  
  Keywords: `migration, refugee, asylum, open borders, integration`
- **Topic B:** e.g. `closed borders`  
  Keywords: `border control, deport, illegal, sovereignty, security`

### 5. State vs individual

- **Topic A:** e.g. `statist`  
  Keywords: `government, regulation, welfare, public, state`
- **Topic B:** e.g. `libertarian`  
  Keywords: `free market, liberty, minimal government, private, deregulation`

---

## How to use in the extension

1. Open **Settings** (political topics) from the popup.
2. Set **Topic A** and **Topic B** labels and their **keywords** (comma-separated).
3. On a YouTube video (or Short), click **Check this video** / **Check this Short**.
4. The result shows Sense, Emotions, Propaganda, and the **political dimension**: bar and/or **wind rose** (needle on the W–E axis for Topic A ↔ Topic B).
5. For many videos at once, use **Analyze a list of video URLs** and check the table of scores.

The wind rose gives a quick compass-style read of where the content sits on the chosen axis (and in future, multiple axes).
