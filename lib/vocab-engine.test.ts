import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_DECKS, MASTER_DICT } from './decks';
import {
  SRS_INTERVALS,
  addDays,
  applyWordOutcome,
  buildCheckinCopyText,
  buildQuizQuestions,
  computeStreak,
  createEmptyDeckProgress,
  createInitialState,
  ensureTodayRecord,
  evaluateSpelling,
  getDayNumber,
  markWordMasteredManually,
  normalizeImportedWords,
  parseAndLookupWords,
  pickChoiceDistractors,
  splitExampleWithTarget,
} from './vocab-engine';

test('All 6 built-in decks have exactly 100 unique, valid words with 8-14 word examples', () => {
  assert.equal(BUILTIN_DECKS.length, 6);

  for (const deck of BUILTIN_DECKS) {
    assert.equal(deck.words.length, 100, `Deck ${deck.id} count should be 100`);

    const wordsSeen = new Set<string>();
    const meaningsSeen = new Set<string>();
    const examplesSeen = new Set<string>();

    for (const entry of deck.words) {
      const key = entry.word.toLowerCase();
      assert.ok(!wordsSeen.has(key), `Duplicate word ${entry.word} in ${deck.id}`);
      wordsSeen.add(key);

      assert.ok(!meaningsSeen.has(entry.meaning), `Duplicate meaning "${entry.meaning}" in ${deck.id}`);
      meaningsSeen.add(entry.meaning);

      assert.ok(!examplesSeen.has(entry.example), `Duplicate example in ${deck.id}: ${entry.example}`);
      examplesSeen.add(entry.example);

      assert.ok(entry.word.trim().length > 0, `Empty word in ${deck.id}`);
      assert.ok(entry.phonetic.startsWith('/') && entry.phonetic.endsWith('/'), `Invalid phonetic ${entry.phonetic} for ${entry.word}`);
      assert.ok(entry.pos.trim().length > 0, `Empty pos for ${entry.word}`);
      assert.ok(entry.meaning.trim().length > 0, `Empty meaning for ${entry.word}`);
      assert.ok(entry.exampleZh.trim().length > 0, `Empty exampleZh for ${entry.word}`);
      assert.ok(entry.memo.trim().length > 0, `Empty memo for ${entry.word}`);
      assert.ok(entry.collocations.trim().length > 0, `Empty collocations for ${entry.word}`);
      assert.ok(entry.family.trim().length > 0, `Empty family for ${entry.word}`);
      assert.ok(entry.confusable.trim().length > 0, `Empty confusable for ${entry.word}`);

      const wordCount = entry.example.trim().split(/\s+/).length;
      assert.ok(
        wordCount >= 8 && wordCount <= 14,
        `Example word count for ${deck.id}/${entry.word} is ${wordCount} (expected 8-14): "${entry.example}"`
      );
    }
  }
});

test('SRS follows fixed 1/2/4/7/15 intervals, resets on error, and removes from wrong after 5 consecutive rights', () => {
  const day1 = '2026-11-15';
  let progress = createEmptyDeckProgress(day1);

  // Wrong on day 1 -> stage 0, next +1 day, in wrong list with n=1
  progress = applyWordOutcome(progress, 'abandon', false, day1, true);
  assert.equal(progress.wrong['abandon'].n, 1);
  assert.equal(progress.wrong['abandon'].stage, 0);
  assert.equal(progress.wrong['abandon'].next, addDays(day1, SRS_INTERVALS[0]));

  // 1st right -> stage 1, next +2 days
  const d2 = addDays(day1, 1);
  progress = applyWordOutcome(progress, 'abandon', true, d2);
  assert.equal(progress.srs['abandon'].streak, 1);
  assert.equal(progress.srs['abandon'].next, addDays(d2, SRS_INTERVALS[1]));
  assert.ok(progress.wrong['abandon'], 'Still in wrong book before 5 consecutive rights');

  // 2nd, 3rd, 4th right -> stages 2 (+4d), 3 (+7d), 4 (+15d)
  const d3 = progress.srs['abandon'].next;
  progress = applyWordOutcome(progress, 'abandon', true, d3);
  assert.equal(progress.srs['abandon'].streak, 2);
  assert.equal(progress.srs['abandon'].next, addDays(d3, SRS_INTERVALS[2]));

  const d4 = progress.srs['abandon'].next;
  progress = applyWordOutcome(progress, 'abandon', true, d4);
  assert.equal(progress.srs['abandon'].streak, 3);
  assert.equal(progress.srs['abandon'].next, addDays(d4, SRS_INTERVALS[3]));

  const d5 = progress.srs['abandon'].next;
  progress = applyWordOutcome(progress, 'abandon', true, d5);
  assert.equal(progress.srs['abandon'].streak, 4);
  assert.equal(progress.srs['abandon'].next, addDays(d5, SRS_INTERVALS[4]));

  // 5th consecutive right -> mastered and removed from wrong book
  const d6 = progress.srs['abandon'].next;
  progress = applyWordOutcome(progress, 'abandon', true, d6);
  assert.equal(progress.srs['abandon'].mastered, true);
  assert.equal(progress.wrong['abandon'], undefined);

  // Error resets streak to 0 and next to +1 day
  progress = applyWordOutcome(progress, 'academic', true, day1);
  progress = applyWordOutcome(progress, 'academic', false, d2, true);
  assert.equal(progress.srs['academic'].streak, 0);
  assert.equal(progress.srs['academic'].next, addDays(d2, 1));
  assert.equal(progress.wrong['academic'].n, 1);
});

test('Daily queue prioritizes due reviews while reserving at least 1 new word and supports live dailySize resize', () => {
  const day1 = '2026-11-15';
  const day2 = '2026-11-16';
  const deck = BUILTIN_DECKS[0];
  let progress = createEmptyDeckProgress(day1);

  // Make 10 words due for review on day2
  for (let i = 0; i < 10; i++) {
    progress = applyWordOutcome(progress, deck.words[i].word, false, day1, true);
  }
  progress.cursor = 10;

  const { record } = ensureTodayRecord(progress, deck, day2, 7);
  assert.equal(record.queue.length, 7);
  assert.equal(record.reviewCount, 6);
  assert.equal(record.newCount, 1);

  // Increasing dailySize from 7 to 10 expands queue without losing studied words
  const studiedProg: typeof progress = {
    ...progress,
    daily: {
      [day2]: {
        ...record,
        studiedWords: [record.queue[0].word, record.queue[1].word],
      },
    },
  };
  const resizedUp = ensureTodayRecord(studiedProg, deck, day2, 10);
  assert.equal(resizedUp.record.queue.length, 10);
  assert.deepEqual(resizedUp.record.studiedWords, [record.queue[0].word, record.queue[1].word]);

  // Decreasing dailySize to 5 keeps queue at 5 (or studied length if >= target)
  const resizedDown = ensureTodayRecord(studiedProg, deck, day2, 5);
  assert.equal(resizedDown.record.queue.length, 5);
});

test('Distractor selection prioritizes same POS and similar initial/length', () => {
  const deck = BUILTIN_DECKS[0];
  const target = deck.words[0]; // abandon (v.)
  const distractors = pickChoiceDistractors(target, deck.words, 1);
  assert.equal(distractors.length, 3);
  const samePosCount = distractors.filter((d) => d.pos === target.pos).length;
  assert.equal(samePosCount, 3, 'All 3 distractors should match verb POS in CET4');

  const questions = buildQuizQuestions(deck.words.slice(0, 7), deck.words, 1);
  assert.equal(questions[0].type, 'choice');
  assert.equal(questions[1].type, 'spell');
  assert.equal(questions[0].options?.filter((o) => o.isCorrect).length, 1);
});

test('Spelling evaluator creates char-by-char diff and ignores case/whitespace', () => {
  const ok = evaluateSpelling('  AbAnDoN ', 'abandon');
  assert.equal(ok.isMatch, true);
  assert.equal(ok.errorHints.length, 0);

  const bad = evaluateSpelling('abanden', 'abandon');
  assert.equal(bad.isMatch, false);
  assert.equal(bad.diff[5].status, 'wrong');
  assert.equal(bad.diff[5].expected, 'o');
  assert.equal(bad.diff[5].actual, 'e');
  assert.ok(bad.errorHints.some((h) => h.includes('第 6 位应为 "o"（误输 "e"）')));

  const missingAndExtra = evaluateSpelling('academ', 'academic');
  assert.equal(missingAndExtra.diff[6].status, 'missing');
  assert.ok(missingAndExtra.errorHints.some((h) => h.includes('第 7 位缺失 "i"')));
});

test('Streak calculation counts consecutive days from today or yesterday', () => {
  const today = '2026-11-15';
  assert.equal(computeStreak({ '2026-11-14': true, '2026-11-13': true }, today), 2);
  assert.equal(computeStreak({ '2026-11-15': true, '2026-11-14': true }, today), 2);
  assert.equal(computeStreak({ '2026-11-12': true }, today), 0);
  assert.equal(getDayNumber('2026-11-10', '2026-11-15'), 6);
});

test('Batch paste lookup hits MASTER_DICT and leaves unknown words for inline edit', () => {
  const res = parseAndLookupWords('abandon, academic; unknownwordxyz\nalgorithm');
  assert.equal(res.matched.length, 3);
  assert.deepEqual(res.unmatched, ['unknownwordxyz']);
  assert.ok(MASTER_DICT['algorithm']);
});

test('Example target splitter highlights target word and inflections', () => {
  const parts = splitExampleWithTarget('Two cargo barges nearly collided in thick fog.', 'collide');
  assert.ok(parts.some((p) => p.isTarget && p.text.toLowerCase() === 'collided'));
});

test('Manual mastery removes word from wrong list and normalized import handles KyleBing format', () => {
  const today = '2026-11-15';
  let state = createInitialState(today);
  assert.equal(state.dailySize, 7);

  let prog = createEmptyDeckProgress(today);
  prog = applyWordOutcome(prog, 'abandon', false, today, true);
  prog = markWordMasteredManually(prog, 'abandon', today);
  assert.equal(prog.wrong['abandon'], undefined);

  const imported = normalizeImportedWords([
    {
      word: 'testify',
      usphone: 'testəfaɪ',
      translations: [{ type: 'v', translation: '作证；证实' }],
      sentences: [{ sentence: 'Two witnesses agreed to testify in court.', sentence_trans: '两位目击者同意出庭作证。' }],
    },
  ]);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].phonetic, '/testəfaɪ/');
  assert.equal(imported[0].pos, 'v.');

  const copy = buildCheckinCopyText({
    day: 3,
    date: today,
    deckName: '四级高频',
    newCount: 5,
    reviewCount: 2,
    streak: 3,
  });
  assert.ok(copy.includes('【TCAMP 每日背单词】打卡第 3 天'));
});
