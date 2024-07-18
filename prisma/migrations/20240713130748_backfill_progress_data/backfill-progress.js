// prisma/scripts/backfillProgressState.js

const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultProgressState = {
  chapters: [
    {
      id: 1,
      lessons: [
        { id: 'CH1INT1', path: '/chapter-1/intro-1', completed: false },
        { id: 'CH1INT2', path: '/chapter-1/intro-2', completed: false },
        { id: 'CH1GEN1', path: '/chapter-1/genesis-1', completed: false },
        { id: 'CH1GEN2', path: '/chapter-1/genesis-2', completed: false },
        { id: 'CH1GEN3', path: '/chapter-1/genesis-3', completed: false },
        { id: 'CH1GEN4', path: '/chapter-1/genesis-4', completed: false },
        { id: 'CH1TRA1', path: '/chapter-1/transacting-1', completed: false },
        { id: 'CH1TRA2', path: '/chapter-1/transacting-2', completed: false },
        { id: 'CH1TRA3', path: '/chapter-1/transacting-3', completed: false },
        { id: 'CH1OUT1', path: '/chapter-1/outro-1', completed: false },
        { id: 'CH1OUT2', path: '/chapter-1/outro-2', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 2,
      lessons: [
        { id: 'CH2INT1', path: '/chapter-2/intro-1', completed: false },
        { id: 'CH2INT2', path: '/chapter-2/intro-2', completed: false },
        { id: 'CH2HSH1', path: '/chapter-2/hashing-1', completed: false },
        { id: 'CH2HSH2', path: '/chapter-2/hashing-2', completed: false },
        { id: 'CH2HSH3', path: '/chapter-2/hashing-3', completed: false },
        { id: 'CH2HSH4', path: '/chapter-2/hashing-4', completed: false },
        { id: 'CH2HSH5', path: '/chapter-2/hashing-5', completed: false },
        { id: 'CH2HSH6', path: '/chapter-2/hashing-6', completed: false },
        { id: 'CH2SCR1', path: '/chapter-2/scripting-1', completed: false },
        { id: 'CH2SCR2', path: '/chapter-2/scripting-2', completed: false },
        { id: 'CH2MIN1', path: '/chapter-2/mining-1', completed: false },
        { id: 'CH2OUT1', path: '/chapter-2/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 3,
      lessons: [
        { id: 'CH3INT1', path: '/chapter-3/intro-1', completed: false },
        { id: 'CH3SOL1', path: '/chapter-3/solo-1', completed: false },
        { id: 'CH3POL1', path: '/chapter-3/pool-1', completed: false },
        { id: 'CH3POL2', path: '/chapter-3/pool-2', completed: false },
        { id: 'CH3COO1', path: '/chapter-3/coop-1', completed: false },
        { id: 'CH3COO2', path: '/chapter-3/coop-2', completed: false },
        { id: 'CH3COO3', path: '/chapter-3/coop-3', completed: false },
        { id: 'CH3SPL1', path: '/chapter-3/split-1', completed: false },
        { id: 'CH3SPL2', path: '/chapter-3/split-2', completed: false },
        { id: 'CH3OUT1', path: '/chapter-3/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 4,
      lessons: [
        { id: 'CH4INT1', path: '/chapter-4/intro-1', completed: false },
        { id: 'CH4PKY1', path: '/chapter-4/public-key-1', completed: false },
        { id: 'CH4PKY2', path: '/chapter-4/public-key-2', completed: false },
        { id: 'CH4PKY3', path: '/chapter-4/public-key-3', completed: false },
        { id: 'CH4PKY4', path: '/chapter-4/public-key-4', completed: false },
        { id: 'CH4ADR1', path: '/chapter-4/address-1', completed: false },
        { id: 'CH4ADR2', path: '/chapter-4/address-2', completed: false },
        { id: 'CH4ADR3', path: '/chapter-4/address-3', completed: false },
        { id: 'CH4OUT1', path: '/chapter-4/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 5,
      lessons: [
        { id: 'CH5INT1', path: '/chapter-5/intro-1', completed: false },
        { id: 'CH5INT2', path: '/chapter-5/intro-2', completed: false },
        { id: 'CH5INT3', path: '/chapter-5/intro-3', completed: false },
        { id: 'CH5DRM1', path: '/chapter-5/derive-message-1', completed: false },
        { id: 'CH5DRM2', path: '/chapter-5/derive-message-2', completed: false },
        { id: 'CH5DRM3', path: '/chapter-5/derive-message-3', completed: false },
        { id: 'CH5DRM4', path: '/chapter-5/derive-message-4', completed: false },
        { id: 'CH5DRM5', path: '/chapter-5/derive-message-5', completed: false },
        { id: 'CH5DRM6', path: '/chapter-5/derive-message-6', completed: false },
        { id: 'CH5DRM7', path: '/chapter-5/derive-message-7', completed: false },
        { id: 'CH5VFS1', path: '/chapter-5/verify-signature-1', completed: false },
        { id: 'CH5VFS2', path: '/chapter-5/verify-signature-2', completed: false },
        { id: 'CH5VFS3', path: '/chapter-5/verify-signature-3', completed: false },
        { id: 'CH5VFS4', path: '/chapter-5/verify-signature-4', completed: false },
        { id: 'CH5VFS5', path: '/chapter-5/verify-signature-5', completed: false },
        { id: 'CH5VLS1', path: '/chapter-5/validate-signature-1', completed: false },
        { id: 'CH5VLS2', path: '/chapter-5/validate-signature-2', completed: false },
        { id: 'CH5VLS3', path: '/chapter-5/validate-signature-3', completed: false },
        { id: 'CH5VLS4', path: '/chapter-5/validate-signature-4', completed: false },
        { id: 'CH5OUT1', path: '/chapter-5/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 6,
      difficulties: [
        {
          level: 'NORMAL',
          lessons: [
            { id: 'CH6INT1', path: '/chapter-6/intro-1', completed: false },
            { id: 'CH6INT2', path: '/chapter-6/intro-2', completed: false },
            { id: 'CH6INO1', path: '/chapter-6/in-out-1', completed: false },
            { id: 'CH6INO2', path: '/chapter-6/in-out-2', completed: false },
            { id: 'CH6INO3', path: '/chapter-6/in-out-3', completed: false },
            { id: 'CH6INO4_NORMAL', path: '/chapter-6/in-out-4-normal', completed: false },
            { id: 'CH6INO5', path: '/chapter-6/in-out-5', completed: false },
            { id: 'CH6PUT1_NORMAL', path: '/chapter-6/put-it-together-1-normal', completed: false },
            { id: 'CH6PUT2_NORMAL', path: '/chapter-6/put-it-together-2-normal', completed: false },
            { id: 'CH6PUT3_NORMAL', path: '/chapter-6/put-it-together-3-normal', completed: false },
            { id: 'CH6OUT1', path: '/chapter-6/outro-1', completed: false },
          ],
          completed: false,
        },
        {
          level: 'HARD',
          lessons: [
            { id: 'CH6INT1', path: '/chapter-6/intro-1', completed: false },
            { id: 'CH6INT2', path: '/chapter-6/intro-2', completed: false },
            { id: 'CH6INO1', path: '/chapter-6/in-out-1', completed: false },
            { id: 'CH6INO2', path: '/chapter-6/in-out-2', completed: false },
            { id: 'CH6INO3', path: '/chapter-6/in-out-3', completed: false },
            { id: 'CH6INO4_HARD', path: '/chapter-6/in-out-4-hard', completed: false },
            { id: 'CH6INO5', path: '/chapter-6/in-out-5', completed: false },
            { id: 'CH6PUT1_HARD', path: '/chapter-6/put-it-together-1-hard', completed: false },
            { id: 'CH6PUT2_HARD', path: '/chapter-6/put-it-together-2-hard', completed: false },
            { id: 'CH6PUT3_HARD', path: '/chapter-6/put-it-together-3-hard', completed: false },
            { id: 'CH6PUT4', path: '/chapter-6/put-it-together-4-hard', completed: false },
            { id: 'CH6PUT5', path: '/chapter-6/put-it-together-5-hard', completed: false },
            { id: 'CH6PUT6', path: '/chapter-6/put-it-together-6-hard', completed: false },
            { id: 'CH6OUT1', path: '/chapter-6/outro-1', completed: false },
          ],
          completed: false,
        },
      ],
      completed: false,
      selectedDifficulty: 'NORMAL',
      hasDifficulty: true,
    },
    {
      id: 7,
      lessons: [
        { id: 'CH7INT1', path: '/chapter-7/intro-1', completed: false },
        { id: 'CH7INT2', path: '/chapter-7/intro-2', completed: false },
        { id: 'CH7INT3', path: '/chapter-7/intro-3', completed: false },
        { id: 'CH7MPT1', path: '/chapter-7/mempool-transaction-1', completed: false },
        { id: 'CH7OUT1', path: '/chapter-7/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 8,
      lessons: [
        { id: 'CH8INT1', path: '/chapter-8/intro-1', completed: false },
        { id: 'CH8INT2', path: '/chapter-8/intro-2', completed: false },
        { id: 'CH8INT3', path: '/chapter-8/intro-3', completed: false },
        { id: 'CH8BBK1', path: '/chapter-8/building-blocks-1', completed: false },
        { id: 'CH8BBK2', path: '/chapter-8/building-blocks-2', completed: false },
        { id: 'CH8BBK3', path: '/chapter-8/building-blocks-3', completed: false },
        { id: 'CH8BBK4', path: '/chapter-8/building-blocks-4', completed: false },
        { id: 'CH8BBK5', path: '/chapter-8/building-blocks-5', completed: false },
        { id: 'CH8BBK6', path: '/chapter-8/building-blocks-6', completed: false },
        { id: 'CH8BBK7', path: '/chapter-8/building-blocks-7', completed: false },
        { id: 'CH8BBK8', path: '/chapter-8/building-blocks-8', completed: false },
        { id: 'CH8OUT1', path: '/chapter-8/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
    {
      id: 9,
      lessons: [
        { id: 'CH9INT1', path: '/chapter-9/intro-1', completed: false },
        { id: 'CH9INT2', path: '/chapter-9/intro-2', completed: false },
        { id: 'CH9SPL1', path: '/chapter-9/splits-1', completed: false },
        { id: 'CH9SPL2', path: '/chapter-9/splits-2', completed: false },
        { id: 'CH9SPL3', path: '/chapter-9/splits-3', completed: false },
        { id: 'CH9OUT1', path: '/chapter-9/outro-1', completed: false },
      ],
      completed: false,
      hasDifficulty: false,
    },
  ],
  currentChapter: 1,
  currentLesson: 'CH1INT1',
};

const keysMap = {
  'CH1INT1': { chapter: 1, lesson: 'CH1INT1' },
  'CH1INT2': { chapter: 1, lesson: 'CH1INT2' },
  'CH1GEN1': { chapter: 1, lesson: 'CH1GEN1' },
  'CH1GEN2': { chapter: 1, lesson: 'CH1GEN2' },
  'CH1GEN3': { chapter: 1, lesson: 'CH1GEN3' },
  'CH1GEN4': { chapter: 1, lesson: 'CH1GEN4' },
  'CH1TRA1': { chapter: 1, lesson: 'CH1TRA1' },
  'CH1TRA2': { chapter: 1, lesson: 'CH1TRA2' },
  'CH1TRA3': { chapter: 1, lesson: 'CH1TRA3' },
  'CH1OUT1': { chapter: 1, lesson: 'CH1OUT1' },
  'CH1OUT2': { chapter: 1, lesson: 'CH1OUT2' },
  'CH2INT1': { chapter: 2, lesson: 'CH2INT1' },
  'CH2INT2': { chapter: 2, lesson: 'CH2INT2' },
  'CH2HSH1': { chapter: 2, lesson: 'CH2HSH1' },
  'CH2HSH2': { chapter: 2, lesson: 'CH2HSH2' },
  'CH2HSH3': { chapter: 2, lesson: 'CH2HSH3' },
  'CH2HSH4': { chapter: 2, lesson: 'CH2HSH4' },
  'CH2HSH5': { chapter: 2, lesson: 'CH2HSH5' },
  'CH2HSH6': { chapter: 2, lesson: 'CH2HSH6' },
  'CH2SCR1': { chapter: 2, lesson: 'CH2SCR1' },
  'CH2SCR2': { chapter: 2, lesson: 'CH2SCR2' },
  'CH2MIN1': { chapter: 2, lesson: 'CH2MIN1' },
  'CH2OUT1': { chapter: 2, lesson: 'CH2OUT1' },
  'CH3INT1': { chapter: 3, lesson: 'CH3INT1' },
  'CH3SOL1': { chapter: 3, lesson: 'CH3SOL1' },
  'CH3POL1': { chapter: 3, lesson: 'CH3POL1' },
  'CH3POL2': { chapter: 3, lesson: 'CH3POL2' },
  'CH3COO1': { chapter: 3, lesson: 'CH3COO1' },
  'CH3COO2': { chapter: 3, lesson: 'CH3COO2' },
  'CH3COO3': { chapter: 3, lesson: 'CH3COO3' },
  'CH3SPL1': { chapter: 3, lesson: 'CH3SPL1' },
  'CH3SPL2': { chapter: 3, lesson: 'CH3SPL2' },
  'CH3OUT1': { chapter: 3, lesson: 'CH3OUT1' },
  'CH4INT1': { chapter: 4, lesson: 'CH4INT1' },
  'CH4PKY1': { chapter: 4, lesson: 'CH4PKY1' },
  'CH4PKY2': { chapter: 4, lesson: 'CH4PKY2' },
  'CH4PKY3': { chapter: 4, lesson: 'CH4PKY3' },
  'CH4PKY4': { chapter: 4, lesson: 'CH4PKY4' },
  'CH4ADR1': { chapter: 4, lesson: 'CH4ADR1' },
  'CH4ADR2': { chapter: 4, lesson: 'CH4ADR2' },
  'CH4ADR3': { chapter: 4, lesson: 'CH4ADR3' },
  'CH4OUT1': { chapter: 4, lesson: 'CH4OUT1' },
  'CH5INT1': { chapter: 5, lesson: 'CH5INT1' },
  'CH5INT2': { chapter: 5, lesson: 'CH5INT2' },
  'CH5INT3': { chapter: 5, lesson: 'CH5INT3' },
  'CH5DRM1': { chapter: 5, lesson: 'CH5DRM1' },
  'CH5DRM2': { chapter: 5, lesson: 'CH5DRM2' },
  'CH5DRM3': { chapter: 5, lesson: 'CH5DRM3' },
  'CH5DRM4': { chapter: 5, lesson: 'CH5DRM4' },
  'CH5DRM5': { chapter: 5, lesson: 'CH5DRM5' },
  'CH5DRM6': { chapter: 5, lesson: 'CH5DRM6' },
  'CH5DRM7': { chapter: 5, lesson: 'CH5DRM7' },
  'CH5VFS1': { chapter: 5, lesson: 'CH5VFS1' },
  'CH5VFS2': { chapter: 5, lesson: 'CH5VFS2' },
  'CH5VFS3': { chapter: 5, lesson: 'CH5VFS3' },
  'CH5VFS4': { chapter: 5, lesson: 'CH5VFS4' },
  'CH5VFS5': { chapter: 5, lesson: 'CH5VFS5' },
  'CH5VLS1': { chapter: 5, lesson: 'CH5VLS1' },
  'CH5VLS2': { chapter: 5, lesson: 'CH5VLS2' },
  'CH5VLS3': { chapter: 5, lesson: 'CH5VLS3' },
  'CH5VLS4': { chapter: 5, lesson: 'CH5VLS4' },
  'CH5OUT1': { chapter: 5, lesson: 'CH5OUT1' },
  'CH6INT1': { chapter: 6, lesson: 'CH6INT1' },
  'CH6INT2': { chapter: 6, lesson: 'CH6INT2' },
  'CH6INO1': { chapter: 6, lesson: 'CH6INO1' },
  'CH6INO2': { chapter: 6, lesson: 'CH6INO2' },
  'CH6INO3': { chapter: 6, lesson: 'CH6INO3' },
  'CH6INO4': { chapter: 6, lesson: 'CH6INO4_NORMAL' },
  'CH6INO5': { chapter: 6, lesson: 'CH6INO5' },
  'CH6PUT1': { chapter: 6, lesson: 'CH6PUT1_NORMAL' },
  'CH6PUT2': { chapter: 6, lesson: 'CH6PUT2_NORMAL' },
  'CH6PUT3': { chapter: 6, lesson: 'CH6PUT3_NORMAL' },
  'CH6OUT1': { chapter: 6, lesson: 'CH6OUT1' },
  'CH7INT1': { chapter: 7, lesson: 'CH7INT1' },
  'CH7INT2': { chapter: 7, lesson: 'CH7INT2' },
  'CH7INT3': { chapter: 7, lesson: 'CH7INT3' },
  'CH7MPT1': { chapter: 7, lesson: 'CH7MPT1' },
  'CH7OUT1': { chapter: 7, lesson: 'CH7OUT1' },
  'CH8INT1': { chapter: 8, lesson: 'CH8INT1' },
  'CH8INT2': { chapter: 8, lesson: 'CH8INT2' },
  'CH8INT3': { chapter: 8, lesson: 'CH8INT3' },
  'CH8BBK1': { chapter: 8, lesson: 'CH8BBK1' },
  'CH8BBK2': { chapter: 8, lesson: 'CH8BBK2' },
  'CH8BBK3': { chapter: 8, lesson: 'CH8BBK3' },
  'CH8BBK4': { chapter: 8, lesson: 'CH8BBK4' },
  'CH8BBK5': { chapter: 8, lesson: 'CH8BBK5' },
  'CH8BBK6': { chapter: 8, lesson: 'CH8BBK6' },
  'CH8BBK7': { chapter: 8, lesson: 'CH8BBK7' },
  'CH8BBK8': { chapter: 8, lesson: 'CH8BBK8' },
  'CH8OUT1': { chapter: 8, lesson: 'CH8OUT1' },
  'CH9INT1': { chapter: 9, lesson: 'CH9INT1' },
  'CH9INT2': { chapter: 9, lesson: 'CH9INT2' },
  'CH9SPL1': { chapter: 9, lesson: 'CH9SPL1' },
  'CH9SPL2': { chapter: 9, lesson: 'CH9SPL2' },
  'CH9SPL3': { chapter: 9, lesson: 'CH9SPL3' },
  'CH9OUT1': { chapter: 9, lesson: 'CH9OUT1' },
};

async function duplicateAccountsData(accountId, lessonId, newLessonId) {
  const dataEntries = await prisma.accounts_data.findMany({
    where: {
      account: accountId,
      lesson_id: lessonId,
    },
  });

  for (const entry of dataEntries) {
    await prisma.accounts_data.create({
      data: {
        account: entry.account,
        lesson_id: newLessonId,
        data: entry.data,
      },
    });
  }
}

async function main() {
  const accountsProgress = await prisma.accounts_progress.findMany({
    where: { 
      progress_state: {
        equals: Prisma.JsonNullValueFilter.Null
      }
    },
  });

  for (const account of accountsProgress) {
    const progress = account.progress;
    const progressKey = keysMap[progress];

    if (!progressKey) {
      console.error(`Unknown progress key: ${progress}`);
      continue;
    }

    const newProgressState = JSON.parse(JSON.stringify(defaultProgressState));

    newProgressState.currentChapter = progressKey.chapter;
    newProgressState.currentLesson = progressKey.lesson;

    for (const chapter of newProgressState.chapters) {
      if (chapter.id < progressKey.chapter) {
        chapter.completed = true;
        for (const lesson of chapter.lessons) {
          lesson.completed = true;
        }
      } else if (chapter.id === progressKey.chapter) {
        for (const lesson of chapter.lessons) {
          if (lesson.id === progressKey.lesson) {
            lesson.completed = true;
            break;
          }
          lesson.completed = true;
        }
      }
    }

    await prisma.accounts_progress.update({
      where: { id: account.id },
      data: { progress_state: newProgressState },
    });

    // Duplicate accounts_data rows for lessons with difficulty
    const lessonsToDuplicate = [
      { oldId: 'CH6INO4', newId: 'CH6INO4_NORMAL' },
      { oldId: 'CH6PUT1', newId: 'CH6PUT1_NORMAL' },
      { oldId: 'CH6PUT2', newId: 'CH6PUT2_NORMAL' },
      { oldId: 'CH6PUT3', newId: 'CH6PUT3_NORMAL' },
    ];

    for (const lesson of lessonsToDuplicate) {
      await duplicateAccountsData(account.id, lesson.oldId, lesson.newId);
    }
  }

  console.log('Backfill completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
