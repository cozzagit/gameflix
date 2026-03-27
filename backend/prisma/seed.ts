import { PrismaClient, Role, BadgeCategory, ScoringType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Categories ---
  const brainlab = await prisma.category.upsert({
    where: { slug: 'brainlab' },
    update: {},
    create: {
      name: 'BrainLab',
      slug: 'brainlab',
      tagline: 'Allena la mente',
      description:
        'Giochi di logica, puzzle e sfide mentali per tenere il cervello in allenamento.',
      color: '#6C5CE7',
      displayOrder: 1,
      isActive: true,
    },
  });

  const wordforge = await prisma.category.upsert({
    where: { slug: 'wordforge' },
    update: {},
    create: {
      name: 'WordForge',
      slug: 'wordforge',
      tagline: 'Il potere delle parole',
      description:
        'Giochi di parole, anagrammi e sfide linguistiche per gli amanti della lingua.',
      color: '#00B894',
      displayOrder: 2,
      isActive: false,
    },
  });

  const quizarena = await prisma.category.upsert({
    where: { slug: 'quizarena' },
    update: {},
    create: {
      name: 'QuizArena',
      slug: 'quizarena',
      tagline: 'Metti alla prova le tue conoscenze',
      description:
        'Quiz, trivia e domande su ogni argomento. Quanto ne sai davvero?',
      color: '#FDCB6E',
      displayOrder: 3,
      isActive: false,
    },
  });

  console.log('Categories created:', brainlab.id, wordforge.id, quizarena.id);

  // --- Plans ---
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free',
      slug: 'free',
      priceMonthly: null,
      priceYearly: null,
      features: {
        maxGamesPerDay: 3,
        leaderboard: true,
        badges: true,
        dailyChallenges: false,
        noAds: false,
      },
      isActive: true,
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { slug: 'premium' },
    update: {},
    create: {
      name: 'Premium',
      slug: 'premium',
      priceMonthly: 4.99,
      priceYearly: 39.99,
      features: {
        maxGamesPerDay: -1,
        leaderboard: true,
        badges: true,
        dailyChallenges: true,
        noAds: true,
        exclusiveGames: true,
        streakFreeze: 3,
      },
      isActive: true,
    },
  });

  console.log('Plans created:', freePlan.id, premiumPlan.id);

  // --- PlanCategory links (premium gets all categories) ---
  for (const category of [brainlab, wordforge, quizarena]) {
    await prisma.planCategory.upsert({
      where: {
        planId_categoryId: {
          planId: premiumPlan.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        planId: premiumPlan.id,
        categoryId: category.id,
      },
    });
  }

  // Free plan gets only brainlab
  await prisma.planCategory.upsert({
    where: {
      planId_categoryId: {
        planId: freePlan.id,
        categoryId: brainlab.id,
      },
    },
    update: {},
    create: {
      planId: freePlan.id,
      categoryId: brainlab.id,
    },
  });

  console.log('Plan-category links created');

  // --- Graviton game ---
  const graviton = await prisma.game.upsert({
    where: { slug: 'graviton' },
    update: {},
    create: {
      slug: 'graviton',
      title: 'Graviton',
      description:
        'Sfida la gravita! Posiziona i blocchi e sfrutta la fisica per raggiungere il punteggio massimo. Un puzzle game che mette alla prova logica e intuizione.',
      categoryId: brainlab.id,
      difficulty: 3,
      scoringType: ScoringType.POINTS,
      supportsDaily: true,
      isPublished: true,
      publishedAt: new Date(),
      estimatedDurationMin: 5,
      config: {
        gridSize: 8,
        maxMoves: 30,
        gravityStrength: 1.0,
        bonusMultiplier: 1.5,
      },
      version: '1.0.0',
    },
  });

  // Tags for Graviton
  const gravitonTags = ['puzzle', 'physics', 'logic', 'strategy'];
  for (const tag of gravitonTags) {
    await prisma.gameTag.upsert({
      where: {
        gameId_tag: {
          gameId: graviton.id,
          tag,
        },
      },
      update: {},
      create: {
        gameId: graviton.id,
        tag,
      },
    });
  }

  console.log('Graviton game created:', graviton.id);

  // --- Badges ---
  const badges = [
    {
      slug: 'first-play',
      name: 'Prima Partita',
      description: 'Hai giocato la tua prima partita!',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minGamesPlayed: 1 },
      xpReward: 10,
    },
    {
      slug: 'ten-games',
      name: 'Giocatore Assiduo',
      description: 'Hai completato 10 partite.',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minGamesPlayed: 10 },
      xpReward: 25,
    },
    {
      slug: 'fifty-games',
      name: 'Veterano',
      description: 'Hai completato 50 partite.',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minGamesPlayed: 50 },
      xpReward: 75,
    },
    {
      slug: 'hundred-games',
      name: 'Centurione',
      description: 'Hai completato 100 partite.',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minGamesPlayed: 100 },
      xpReward: 150,
    },
    {
      slug: 'streak-3',
      name: 'Costante',
      description: 'Hai giocato 3 giorni consecutivi.',
      category: BadgeCategory.STREAK,
      condition: { minStreak: 3 },
      xpReward: 15,
    },
    {
      slug: 'streak-7',
      name: 'Settimana Perfetta',
      description: 'Hai giocato 7 giorni consecutivi.',
      category: BadgeCategory.STREAK,
      condition: { minStreak: 7 },
      xpReward: 50,
    },
    {
      slug: 'streak-30',
      name: 'Mese di Fuoco',
      description: 'Hai giocato 30 giorni consecutivi.',
      category: BadgeCategory.STREAK,
      condition: { minStreak: 30 },
      xpReward: 200,
    },
    {
      slug: 'streak-100',
      name: 'Inarrestabile',
      description: 'Hai giocato 100 giorni consecutivi!',
      category: BadgeCategory.STREAK,
      condition: { minStreak: 100 },
      xpReward: 500,
    },
    {
      slug: 'first-like',
      name: 'Fan',
      description: 'Hai messo il tuo primo like.',
      category: BadgeCategory.SOCIAL,
      condition: { minLikes: 1 },
      xpReward: 5,
    },
    {
      slug: 'ten-likes',
      name: 'Critico',
      description: 'Hai messo 10 like.',
      category: BadgeCategory.SOCIAL,
      condition: { minLikes: 10 },
      xpReward: 20,
    },
    {
      slug: 'level-5',
      name: 'Livello 5',
      description: 'Hai raggiunto il livello 5.',
      category: BadgeCategory.MASTERY,
      condition: { minLevel: 5 },
      xpReward: 30,
    },
    {
      slug: 'level-10',
      name: 'Doppia Cifra',
      description: 'Hai raggiunto il livello 10.',
      category: BadgeCategory.MASTERY,
      condition: { minLevel: 10 },
      xpReward: 75,
    },
    {
      slug: 'level-20',
      name: 'Maestro',
      description: 'Hai raggiunto il livello 20.',
      category: BadgeCategory.MASTERY,
      condition: { minLevel: 20 },
      xpReward: 200,
    },
    {
      slug: 'xp-1000',
      name: 'Mille XP',
      description: 'Hai accumulato 1000 XP.',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minXp: 1000 },
      xpReward: 50,
    },
    {
      slug: 'xp-10000',
      name: 'Diecimila XP',
      description: 'Hai accumulato 10000 XP.',
      category: BadgeCategory.ACHIEVEMENT,
      condition: { minXp: 10000 },
      xpReward: 250,
    },
    {
      slug: 'first-score',
      name: 'In Classifica',
      description: 'Hai registrato il tuo primo punteggio.',
      category: BadgeCategory.EXPLORATION,
      condition: { minScores: 1 },
      xpReward: 10,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: {
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        condition: badge.condition,
        xpReward: badge.xpReward,
        isActive: true,
      },
    });
  }

  console.log(`${badges.length} badges created`);

  // --- Admin user ---
  const adminPasswordHash = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@gameflix.com' },
    update: {},
    create: {
      email: 'admin@gameflix.com',
      passwordHash: adminPasswordHash,
      displayName: 'Admin',
      role: Role.ADMIN,
    },
  });

  console.log('Admin user created: admin@gameflix.com / password123');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
