---
name: anti-slop-product-design
description: Product and UX design methodology built from the 13-version Web Push lessons and real critiques on X and Reddit. This skill requires market research, checks of OS constraints, localization from day one, and simple, direct UI design.
---

# Product Design Without AI Slop

Follow this workflow whenever you design a new feature, UI, or OPSEC mechanism. These steps come from the Web Push lessons and community critiques of AI-generated UI ("AI slop"), and they prevent over-engineered designs that ignore how people actually use the app.

### 0. Core Prerequisites: Think and Research
- **Think Before Acting**: Read the code and understand the existing architecture and the user's explicit constraints before you propose any design or refactor any component.
- **Internet Research**: Do not guess or invent answers when you work with established security models or standards. Search the web for authoritative implementations and follow them.

### 1. Check OS and Architecture Limits
- **Match the App's Architecture**: Do not invent user flows that conflict with how the app actually works. For example, when the app logs in automatically, a fake landing page cannot work.
- **State the Core Web App Limit**: When a web app stores data in the browser, **clearing the browser cache permanently deletes all local data**. State this fact directly to the user instead of hiding it behind a metaphor such as a "Permanent Vault".
- **Verify Platform Constraints**: Verify what the operating system does not allow you to change before you propose features such as widgets or push notifications. For example, Web Push on iOS and Android always displays the app name.

### 2. Market Research and Community Critiques (X and Reddit)
- **No Unfounded Features**: Do not invent features from guesswork.
- **Search X (Twitter) for Design Critiques**: Search X for real critiques from designers and developers using queries such as `[pattern] "AI slop" OR "annoying"`. Look for common signs of AI-generated UI:
  - *Visual slop*: Unnecessary pulsing dots (`animate-pulse`), glowing neon pills, and decorative cards that push primary buttons below the fold.
  - *Copywriting slop*: Defensive, flattering, or stiff corporate phrasing such as `"绝不触碰"`, `"赋能"`, and `"确保安全无虞"`, or vague labels such as `"我的记录"` instead of `"反馈记录"`.
  - *Rule*: Remove any decorative element that designers on X would mock as AI-generated junk.
- **Search Reddit for UX Pitfalls**: Search Reddit for complaints from real users in communities such as `r/sysadmin`, `r/webdev`, and `r/UXDesign`. Avoid hostile patterns such as the "Watermelon Effect", where a form for reporting bugs displays a green `"Operational 🟢"` badge while the user is experiencing an outage.
- **Check HCI and Market Research**: When you design for high-risk users, read Human-Computer Interaction (HCI) papers or market research to verify that the flow does not overload the user under stress.
- **Follow Industry Standards**: Check how Signal, Telegram, and WeChat handle the same problem. When those apps disguise a privacy notification by displaying `"New Message"`, use the same approach so that the notification blends in.

### 3. Universal Simplicity (Directness in UX)
- Keep every flow direct and simple, and cut unnecessary steps.
- **Viewport Rule (Primary CTAs Always Visible)**: Keep primary buttons such as Submit, Cancel, and Save sticky or immediately visible in the viewport on both mobile and desktop. Do not let headers, status banners, or decorative widgets push these buttons off the screen.
- **Neutral Status Links**: Use quiet, neutral text links for status and diagnostic pages (such as `查看系统运行状态 ↗`) instead of colored status badges.
- **Concrete Labels**: Never use vague labels such as `"我的记录"`. Name the exact item, such as `"反馈记录"` (Feedback History).
- **No Redundant Questions**: When the app is built around a specific privacy premise (such as anonymity), do not ask the user whether they want that premise. By using the app, the user has already chosen it, and asking again adds pointless friction.
- **Upfront Disclaimers (No Traps)**: When you screen out users whose needs do not match the app, do not set a trap where they pick desired features and get rejected. State the architectural limits upfront instead (for example, `"If you need X, this app cannot provide it"`).
- **Plain Human Language**: Do not use academic or developer terms in UI copy, such as `"Threat Model"`, `"Adversaries"`, or `"Platform Data Collection"`. Describe the situation in everyday words, such as `"Roommates checking my phone"`.
- **Chesterton's Fence for UI State**: Check whether the existing UI states already cover the required dimensions before you rewrite a questionnaire to fit a new framework. Map the framework onto the existing state machine instead of adding or removing steps without need.
- **Sensible Defaults**: Set the default behavior to what 99% of users expect. Keep advanced OPSEC features strictly opt-in and tucked away.

### 4. Localization (i18n) from Day One
- Do not propose hardcoded single-language strings or mixed-language arrays.
- Provide natural, culturally appropriate strings for both `en` and `zh` in every UI proposal, following the conventions for `src/lib/i18n.ts`.

### 5. Fail-Silent Rule for OPSEC Features
- Abort the operation silently whenever a privacy-critical feature fails to read its configuration (for example, when reading from IndexedDB fails).
- Never fall back to a generic default that could expose the user's hidden state. Missing a notification is an inconvenience, whereas exposing a user's privacy state is a critical failure: when the check cannot run safely, do not run the action.

### 6. Case Studies: Before and After Examples
The examples below come from real review iterations and show the difference between AI slop and direct UX:

- **Rule: No Green Status Badges or Pulsing Pills in Feedback Flows**
  - *BAD (Slop)*: Putting a pulsing `[ 🟢 运行正常 ↗ ]` badge in the header of the feedback drawer, naming a tab `[ 我的记录 ]`, and writing defensive copy such as `诊断数据仅收集环境与报错类型，绝不触碰您的端到端加密消息内容。` (contradicts users who are reporting a bug, clutters the header, and uses vague labels and stiff jargon).
  - *GOOD (Direct)*: A clean header (`发送反馈` + `[X]`), concrete tab names (`提交反馈` | `反馈记录`), a sticky footer for Submit and Cancel, honest copy (`我们仅收集报错类型和环境信息，绝不收集您的加密消息内容。感谢您的耐心与谅解。`), and a quiet text link in the footer for system status without green badges.

- **Rule: No Redundant Questions**
  - *BAD (Slop)*: Asking an anonymous user: `"Do you want to hide your identity from the platform?"` (users of an anonymous app have already chosen this, so asking again is pointless friction).
  - *GOOD (Direct)*: Remove the question instead of asking users to confirm the core premise of the app.

- **Rule: State OS and Browser Realities Directly**
  - *BAD (Evasive)*: `"Treat this as a permanently secure vault"` (hides the actual architectural risk behind a metaphor).
  - *GOOD (Direct)*: `"Permanent storage (Warning: clearing browser cache permanently deletes all data)"` (states the limit of browser storage directly so that the user knows the real risk).

- **Rule: Replace Developer Jargon with Everyday Language**
  - *BAD (Slop)*: `"Threat Model: Adversaries"`, `"Data collection by tech companies"`, `"Physical access"`.
  - *GOOD (Direct)*: `"Who are you trying to protect against?"`, `"People who might check my phone (e.g., family)"`, `"Remote hackers on public Wi-Fi"`.

- **Rule: Upfront Disclaimers Instead of Traps**
  - *BAD (Slop)*: `"Select the features you want: [ ] Cloud Sync. (If you select this, you are rejected!)"` (punishes users for selecting normal features).
  - *GOOD (Direct)*: `"UC is extreme and sacrifices convenience. If you ABSOLUTELY NEED the following, UC is not for you: [ ] Cloud Sync across devices."`

- **Rule: Untangle Nested Logic**
  - *BAD (Slop)*: `"As long as my identity isn't exposed, I cannot accept losing my chat history forever because I forgot my password."` (mixes two conditions in one sentence and forces the user to read it twice).
  - *GOOD (Direct)*: `"Records first: I fear losing data from forgetting a password more than someone seeing it."`
